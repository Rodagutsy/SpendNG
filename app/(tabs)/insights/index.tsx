import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  Dimensions
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Shadows, Radius } from '@/constants/Tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTransactionStore } from '@/lib/stores/transactionStore';
import { useCategoryStore } from '@/lib/stores/categoryStore';
import { formatCurrency } from '@/lib/utils';

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function getMonthKey(year: number, month: number): string {
  return `${MONTHS_SHORT[month - 1].toLowerCase()}${year}`;
}

function formatMonthLabel(key: string): string {
  const match = key.match(/^([a-z]+)(\d{4})$/);
  if (!match) return key;
  const idx = MONTHS_SHORT.findIndex(m => m.toLowerCase() === match[1]);
  return `${MONTHS_FULL[idx] ?? match[1]} ${match[2]}`;
}

function monthStartEnd(year: number, month: number): { start: number; end: number } {
  const start = new Date(year, month - 1, 1).getTime();
  const end = new Date(year, month, 0, 23, 59, 59, 999).getTime();
  return { start, end };
}

function getWeekId(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (dt: Date) => `${String(dt.getDate()).padStart(2, '0')} ${MONTHS_SHORT[dt.getMonth()]}`;
  return `${fmt(monday)} - ${fmt(sunday)}`;
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

function mapIcon(iconId: string | undefined): string {
  const map: Record<string, string> = {
    utensils: 'restaurant',
    car: 'local-gas-station',
    zap: 'bolt',
    wifi: 'wifi',
    'arrow-up-right': 'arrow-upward',
    'arrow-down-left': 'arrow-downward',
    briefcase: 'business',
    'shopping-bag': 'shopping-bag',
    clapperboard: 'movie',
    stethoscope: 'medical-services',
    'graduation-cap': 'school',
    home: 'home',
    'help-circle': 'help',
  };
  return map[iconId || ''] || 'help';
}

export default function InsightsScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const [selectedMonth, setSelectedMonth] = useState('may2026');
  const [viewYear, setViewYear] = useState(2026);
  const [showFilter, setShowFilter] = useState(false);
  const [filterPos, setFilterPos] = useState({ top: 0, left: 0 });
  const filterBtnRef = useRef<View>(null);
  const windowWidth = Dimensions.get('window').width;

  const transactions = useTransactionStore((s) => s.transactions);
  const categories = useCategoryStore((s) => s.categories);
  const categoryMap = useMemo(() => new Map(categories.map(c => [c.id, c])), [categories]);

  const monthsWithData = useMemo(() => {
    const s = new Set<string>();
    transactions.forEach(t => {
      const d = new Date(t.transactionDate);
      s.add(getMonthKey(d.getFullYear(), d.getMonth() + 1));
    });
    return s;
  }, [transactions]);

  const selParsed = useMemo(() => {
    const m = selectedMonth.match(/^([a-z]+)(\d{4})$/);
    if (!m) return { year: 2026, month: 5, idx: 4 };
    const idx = MONTHS_SHORT.findIndex(s => s.toLowerCase() === m[1]);
    return { year: parseInt(m[2]), month: idx + 1, idx };
  }, [selectedMonth]);

  const monthTxs = useMemo(() => {
    const { start, end } = monthStartEnd(selParsed.year, selParsed.month);
    return transactions.filter(t => t.transactionDate >= start && t.transactionDate <= end);
  }, [transactions, selParsed]);

  const prevMonthParsed = useMemo(() => {
    const { year, month } = selParsed;
    if (month === 1) return { year: year - 1, month: 12 };
    return { year, month: month - 1 };
  }, [selParsed]);

  const prevMonthTxs = useMemo(() => {
    const { start, end } = monthStartEnd(prevMonthParsed.year, prevMonthParsed.month);
    return transactions.filter(t => t.transactionDate >= start && t.transactionDate <= end);
  }, [transactions, prevMonthParsed]);

  const hasEnoughData = monthTxs.filter(t => t.transactionType === 'debit').length >= 3;

  const insights = useMemo(() => {
    if (!hasEnoughData) return null;

    const credits = monthTxs.filter(t => t.transactionType === 'credit');
    const debits = monthTxs.filter(t => t.transactionType === 'debit');
    const totalCredits = credits.reduce((s, t) => s + t.amount, 0);
    const totalDebits = debits.reduce((s, t) => s + t.amount, 0);
    const pct = totalCredits > 0 ? Math.round((totalDebits / totalCredits) * 100) : 0;

    const prevCredits = prevMonthTxs.filter(t => t.transactionType === 'credit');
    const prevDebits = prevMonthTxs.filter(t => t.transactionType === 'debit');
    const prevTotalCredits = prevCredits.reduce((s, t) => s + t.amount, 0);
    const prevTotalDebits = prevDebits.reduce((s, t) => s + t.amount, 0);
    const prevPct = prevTotalCredits > 0 ? Math.round((prevTotalDebits / prevTotalCredits) * 100) : 0;
    const pctDiff = pct - prevPct;
    const vsPrevious = prevMonthTxs.length > 0
      ? `${pctDiff >= 0 ? '+' : ''}${pctDiff}% vs ${MONTHS_SHORT[prevMonthParsed.month - 1]}`
      : '';

    const catTotals: Record<string, number> = {};
    debits.forEach(t => { catTotals[t.categoryId] = (catTotals[t.categoryId] || 0) + t.amount; });
    const sortedCats = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
    const topCatId = sortedCats[0]?.[0] || '';
    const topCatTotal = sortedCats[0]?.[1] || 0;
    const topCat = categoryMap.get(topCatId);
    const topCatPct = totalDebits > 0 ? Math.round((topCatTotal / totalDebits) * 100) : 0;

    const biggest = debits.reduce((max, t) => t.amount > (max?.amount || 0) ? t : max, debits[0]);

    const merchantCounts: Record<string, number> = {};
    debits.forEach(t => {
      const name = t.merchantName || 'Unknown';
      merchantCounts[name] = (merchantCounts[name] || 0) + 1;
    });
    const sortedMerchants = Object.entries(merchantCounts).sort((a, b) => b[1] - a[1]);
    const topMerchant = sortedMerchants[0]?.[0] || '';
    const topMerchantCount = sortedMerchants[0]?.[1] || 0;

    const prevCatTotals: Record<string, number> = {};
    prevDebits.forEach(t => { prevCatTotals[t.categoryId] = (prevCatTotals[t.categoryId] || 0) + t.amount; });

    const alerts: { icon: string; text: string }[] = [];
    for (const [catId, total] of Object.entries(catTotals)) {
      const prevTotal = prevCatTotals[catId] || 0;
      if (prevTotal > 0) {
        const change = Math.round(((total - prevTotal) / prevTotal) * 100);
        if (change >= 20) {
          const cat = categoryMap.get(catId);
          alerts.push({ icon: 'trending-up', text: `${cat?.name || 'Category'} spending increased by ${change}% this month` });
        }
      }
    }

    const weeks: Record<string, number> = {};
    debits.forEach(t => {
      const wk = getWeekId(new Date(t.transactionDate));
      weeks[wk] = (weeks[wk] || 0) + t.amount;
    });
    const weekEntries = Object.entries(weeks);
    const avgWeekly = weekEntries.length > 0 ? totalDebits / weekEntries.length : 0;
    const currentWeekKey = getWeekId(new Date());
    const currentWeekTotal = weeks[currentWeekKey] || 0;
    if (currentWeekTotal > avgWeekly * 1.2 && topCat && alerts.length < 3) {
      alerts.push({ icon: 'local-fire-department', text: `You spent more than usual on ${topCat.name} this week` });
    }

    if (alerts.length === 0) {
      alerts.push({ icon: 'trending-up', text: 'Your spending this month is within normal range' });
    }

    const patterns: { icon: string; text: string }[] = [];
    if (topMerchant && topMerchantCount > 1) {
      patterns.push({ icon: 'storefront', text: `${topMerchant} is your most frequent merchant` });
    }
    const weekendCount = debits.filter(t => {
      const day = new Date(t.transactionDate).getDay();
      return day === 0 || day === 6;
    }).length;
    const weekdayCount = debits.length - weekendCount;
    patterns.push({
      icon: weekendCount > weekdayCount ? 'weekend' : 'access-time',
      text: weekendCount > weekdayCount ? 'Most spending happens on weekends' : 'Most transactions happen on weekdays',
    });

    const weekAmounts = weekEntries.map(([key, amt]) => ({ key, amount: amt }));
    weekAmounts.sort((a, b) => a.amount - b.amount);
    const best = weekAmounts[0];
    const worst = weekAmounts[weekAmounts.length - 1];

    return {
      pct,
      vsPrevious,
      topCatName: topCat?.name || 'Uncategorized',
      topCatAmount: formatCurrency(topCatTotal),
      topCatPct: `${topCatPct}% of spend`,
      topCatIcon: mapIcon(topCat?.iconIdentifier),
      topCatColor: topCat?.colorHex || '#0B5CFF',
      topCatBg: topCat?.colorHex ? `${topCat.colorHex}20` : '#E6EEFF',
      biggestMerchant: biggest?.merchantName || 'N/A',
      biggestAmount: formatCurrency(biggest?.amount || 0),
      biggestDate: biggest ? formatDate(biggest.transactionDate) : '',
      alerts,
      patterns,
      bestWeek: best ? { dateRange: best.key, amount: formatCurrency(best.amount) } : null,
      worstWeek: worst ? { dateRange: worst.key, amount: formatCurrency(worst.amount) } : null,
    };
  }, [monthTxs, prevMonthTxs, hasEnoughData, categoryMap, prevMonthParsed]);

  const pct = insights?.pct ?? 0;
  const healthColor = pct >= 70 ? theme.roles.error : pct >= 50 ? theme.roles.warning : theme.roles.success;

  const openFilter = () => {
    filterBtnRef.current?.measureInWindow((x, y, width, height) => {
      const match = selectedMonth.match(/^[a-z]+(\d{4})$/);
      if (match) setViewYear(parseInt(match[1]));
      const dropdownWidth = 280;
      let left = x + width - dropdownWidth;
      if (left < 12) left = 12;
      setFilterPos({ top: y + height + 4, left });
      setShowFilter(true);
    });
  };

  return (
    <>
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#F9FAFC' }}>
        <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

        <View style={[styles.headerContainer, { paddingTop: 16 }]}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerTitle}>Insights</Text>
            </View>
            <TouchableOpacity
              ref={filterBtnRef}
              style={styles.filterDropdownBtn}
              onPress={openFilter}
              activeOpacity={0.8}
            >
              <Text style={styles.filterDropdownText}>
                {formatMonthLabel(selectedMonth)}
              </Text>
              <MaterialIcons name="expand-more" size={18} color="#001133" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {hasEnoughData && insights ? (
            <View style={styles.activeLayout}>
              {/* 1. Financial Health Score */}
              <View style={[styles.card, styles.healthCard, Shadows.sm]}>
                <Text style={styles.cardLabel}>Spending Health</Text>
                <View style={styles.healthCenter}>
                  <Text style={[styles.healthPercentage, { color: healthColor }]}>
                    {insights.pct}%
                  </Text>
                  <Text style={styles.healthSubtext}>of income spent this month</Text>
                </View>
                <View style={styles.progressBarBg}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${pct}%`, backgroundColor: healthColor },
                    ]}
                  />
                </View>
                <Text style={[styles.vsPrevious, { color: healthColor }]}>
                  {insights.vsPrevious}
                </Text>
              </View>

              {/* 2. Top Category & Biggest Spend */}
              <View style={styles.sideBySideContainer}>
                <View style={[styles.sideCard, { backgroundColor: insights.topCatBg }]}>
                  <Text style={[styles.categoryLabel, { color: insights.topCatColor }]}>Top Category</Text>
                  <View style={[styles.categoryIconCircle, { backgroundColor: '#FFFFFF' }]}>
                    <MaterialIcons name={insights.topCatIcon as any} size={18} color={insights.topCatColor} />
                  </View>
                  <Text style={[styles.categoryName, { color: '#001133' }]} numberOfLines={1}>
                    {insights.topCatName}
                  </Text>
                  <Text style={[styles.categoryAmount, { color: '#001133' }]} numberOfLines={1}>
                    {insights.topCatAmount}
                  </Text>
                  <Text style={[styles.categorySubtext, { color: insights.topCatColor }]}>
                    {insights.topCatPct}
                  </Text>
                </View>

                <View style={[styles.sideCard, styles.spendCard]}>
                  <Text style={styles.spendLabel}>Biggest Spend</Text>
                  <View style={styles.spendIconCircle}>
                    <MaterialIcons name="local-airport" size={18} color="#D30000" />
                  </View>
                  <Text style={styles.spendMerchant} numberOfLines={1}>
                    {insights.biggestMerchant}
                  </Text>
                  <Text style={styles.spendAmount} numberOfLines={1}>
                    {insights.biggestAmount}
                  </Text>
                  <Text style={styles.spendSubtext}>{insights.biggestDate}</Text>
                </View>
              </View>

              {/* 3. Alerts */}
              <View style={[styles.card, Shadows.sm]}>
                <Text style={styles.cardLabel}>Alerts</Text>
                <View style={styles.alertsContainer}>
                  {insights.alerts.map((alert, i) => (
                    <View key={i} style={styles.alertRow}>
                      <View style={styles.alertIconCircle}>
                        <MaterialIcons name={alert.icon as any} size={16} color="#D30000" />
                      </View>
                      <Text style={styles.alertText}>{alert.text}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* 4. Behaviour Patterns */}
              <View style={[styles.card, { backgroundColor: '#F1F2F6' }, Shadows.sm]}>
                <Text style={styles.cardLabel}>Behaviour Patterns</Text>
                <View style={styles.behaviourContainer}>
                  {insights.patterns.map((pattern, i) => (
                    <View key={i} style={[styles.behaviourRow, i < insights.patterns.length - 1 && styles.behaviourRowBorder]}>
                      <View style={styles.behaviourIconCircle}>
                        <MaterialIcons name={pattern.icon as any} size={18} color="#0B5CFF" />
                      </View>
                      <Text style={styles.behaviourText}>{pattern.text}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* 5. Weekly Breakdown */}
              {insights.bestWeek && insights.worstWeek && (
                <View style={[styles.card, styles.weeklyCard, Shadows.sm]}>
                  <Text style={styles.weeklyLabel}>Weekly Breakdown</Text>
                  <View style={styles.weeklyRow}>
                    <View style={[styles.weeklyArrowCircle, { backgroundColor: '#E8F8EE' }]}>
                      <MaterialIcons name="arrow-upward" size={16} color="#00BD00" />
                    </View>
                    <View style={styles.weeklyRowDetails}>
                      <Text style={styles.weeklyRowTitle}>Best Week</Text>
                      <Text style={styles.weeklyRowDate}>{insights.bestWeek.dateRange}</Text>
                    </View>
                    <Text style={[styles.weeklyAmount, { color: '#00BD00' }]}>
                      {insights.bestWeek.amount}
                    </Text>
                  </View>
                  <View style={styles.weeklyDivider} />
                  <View style={styles.weeklyRow}>
                    <View style={[styles.weeklyArrowCircle, { backgroundColor: '#FDECEB' }]}>
                      <MaterialIcons name="arrow-downward" size={16} color="#D30000" />
                    </View>
                    <View style={styles.weeklyRowDetails}>
                      <Text style={styles.weeklyRowTitle}>Worst Week</Text>
                      <Text style={styles.weeklyRowDate}>{insights.worstWeek.dateRange}</Text>
                    </View>
                    <Text style={[styles.weeklyAmount, { color: '#D30000' }]}>
                      {insights.worstWeek.amount}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          ) : (
            <View style={[styles.emptyContainer, Shadows.sm]}>
              <View style={styles.emptyIconWrapper}>
                <MaterialIcons name="bar-chart" size={56} color="#C5C3BF" />
              </View>
              <Text style={styles.emptyTitle}>Insights Unavailable</Text>
              <Text style={styles.emptyText}>
                Not enough data yet. Keep using SpendNG and insights will appear here.
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      {showFilter && (
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFilter(false)}
        >
          <View style={[styles.calendarDropdown, { top: filterPos.top, left: filterPos.left }]}>
            <View style={styles.calendarYearRow}>
              <TouchableOpacity onPress={() => setViewYear(viewYear - 1)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <MaterialIcons name="chevron-left" size={22} color="#001133" />
              </TouchableOpacity>
              <Text style={styles.calendarYearText}>{viewYear}</Text>
              <TouchableOpacity onPress={() => setViewYear(viewYear + 1)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <MaterialIcons name="chevron-right" size={22} color="#001133" />
              </TouchableOpacity>
            </View>
            <View style={styles.calendarGrid}>
              {MONTHS_SHORT.map((label, index) => {
                const monthNum = index + 1;
                const monthKey = getMonthKey(viewYear, monthNum);
                const isSelected = selectedMonth === monthKey;
                const hasCalendarData = monthsWithData.has(monthKey);
                return (
                  <TouchableOpacity
                    key={monthKey}
                    style={[
                      styles.calendarMonthBtn,
                      isSelected && styles.calendarMonthBtnActive,
                      !hasCalendarData && styles.calendarMonthBtnDisabled,
                    ]}
                    onPress={() => {
                      if (hasCalendarData) {
                        setSelectedMonth(monthKey);
                        setShowFilter(false);
                      }
                    }}
                    disabled={!hasCalendarData}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.calendarMonthLabel,
                      isSelected && styles.calendarMonthLabelActive,
                      !hasCalendarData && styles.calendarMonthLabelDisabled,
                    ]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </TouchableOpacity>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFC',
  },
  headerContainer: {
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
  },
  headerTitle: {
    fontFamily: Typography.fonts.medium, // 500 font weight
    fontSize: Typography.sizes.titleL, // 20px similar font size
    color: '#001133',

  },
  filterDropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F2F6',
    borderRadius: Radius.full,
    paddingVertical: 8,
    paddingHorizontal: 14,
    gap: 4,
    height: 40,
  },
  filterDropdownText: {
    fontFamily: Typography.fonts.medium,
    fontSize: 13,
    color: '#001133',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  calendarDropdown: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    width: 280,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
    }),
  },
  calendarYearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  calendarYearText: {
    fontFamily: Typography.fonts.display,
    fontSize: 18,
    color: '#001133',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarMonthBtn: {
    width: '25%',
    aspectRatio: 1.4,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  calendarMonthBtnActive: {
    backgroundColor: '#0B5CFF',
  },
  calendarMonthBtnDisabled: {
    opacity: 0.3,
  },
  calendarMonthLabel: {
    fontFamily: Typography.fonts.body,
    fontSize: 14,
    color: '#001133',
  },
  calendarMonthLabelActive: {
    color: '#FFFFFF',
    fontFamily: Typography.fonts.medium,
  },
  calendarMonthLabelDisabled: {
    color: '#ADAAA4',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 120 : 100,
  },
  activeLayout: {
    gap: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  cardLabel: {
    fontFamily: Typography.fonts.display,
    fontSize: 14,
    color: '#7B786F',
    marginBottom: 12,
  },
  healthCard: {
    alignItems: 'flex-start',
  },
  healthCenter: {
    alignItems: 'center',
    width: '100%',
    marginVertical: 12,
  },
  healthPercentage: {
    fontFamily: Typography.fonts.display,
    fontSize: 48,
    letterSpacing: -0.5,
  },
  healthSubtext: {
    fontFamily: Typography.fonts.body,
    fontSize: 14,
    color: '#7B786F',
  },
  progressBarBg: {
    width: '100%',
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 6,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  vsPrevious: {
    fontFamily: Typography.fonts.medium,
    fontSize: 14,
    marginTop: 8,
  },
  sideBySideContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  sideCard: {
    flex: 1,
    borderRadius: 12,
    padding: 14,
    justifyContent: 'space-between',
    height: 156,
  },
  categoryLabel: {
    fontFamily: Typography.fonts.display,
    fontSize: 12,
  },
  categoryIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 8,
  },
  categoryName: {
    fontFamily: Typography.fonts.display,
    fontSize: 15,
  },
  categoryAmount: {
    fontFamily: Typography.fonts.display,
    fontSize: 18,
    marginTop: 2,
  },
  categorySubtext: {
    fontFamily: Typography.fonts.body,
    fontSize: 11,
    opacity: 0.8,
    marginTop: 2,
  },
  spendCard: {
    backgroundColor: '#FDECEB',
  },
  spendLabel: {
    fontFamily: Typography.fonts.display,
    fontSize: 12,
    color: '#D30000',
  },
  spendIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 8,
  },
  spendMerchant: {
    fontFamily: Typography.fonts.display,
    fontSize: 15,
    color: '#001133',
  },
  spendAmount: {
    fontFamily: Typography.fonts.display,
    fontSize: 18,
    color: '#D30000',
    marginTop: 2,
  },
  spendSubtext: {
    fontFamily: Typography.fonts.body,
    fontSize: 11,
    color: '#D30000',
    opacity: 0.8,
    marginTop: 2,
  },
  alertsContainer: {
    gap: 12,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  alertIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FDECEB',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  alertText: {
    flex: 1,
    fontFamily: Typography.fonts.body,
    fontSize: 13,
    color: '#001133',
    lineHeight: 18,
  },
  behaviourContainer: {
    gap: 0,
  },
  behaviourRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  behaviourRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  behaviourIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  behaviourText: {
    flex: 1,
    fontFamily: Typography.fonts.body,
    fontSize: 14,
    color: '#001133',
  },
  weeklyCard: {
    paddingBottom: 8,
  },
  weeklyLabel: {
    fontFamily: Typography.fonts.display,
    fontSize: 14,
    color: '#7B786F',
    marginBottom: 16,
  },
  weeklyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  weeklyArrowCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  weeklyRowDetails: {
    flex: 1,
  },
  weeklyRowTitle: {
    fontFamily: Typography.fonts.body,
    fontSize: 14,
    color: '#001133',
  },
  weeklyRowDate: {
    fontFamily: Typography.fonts.body,
    fontSize: 12,
    color: '#7B786F',
    marginTop: 2,
  },
  weeklyAmount: {
    fontFamily: Typography.fonts.body,
    fontSize: 15,
    fontWeight: '500',
  },
  weeklyDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginLeft: 48,
  },
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  emptyIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F4F5F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontFamily: Typography.fonts.display,
    fontSize: 18,
    color: '#001133',
    marginBottom: 8,
  },
  emptyText: {
    fontFamily: Typography.fonts.body,
    fontSize: 14,
    color: '#7B786F',
    textAlign: 'center',
    lineHeight: 22,
  },
});
