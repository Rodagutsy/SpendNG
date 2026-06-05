import React, { useState, useRef } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Shadows, Radius } from '@/constants/Tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const monthKey = (year: number, month: number) =>
  `${MONTH_NAMES[month].toLowerCase()}${year}`;

const MOCK_DATA: Record<string, {
  spendingHealth: { percentage: number; subtext: string; vsPrevious: string };
  topCategory: { name: string; amount: string; percentage: string; icon: 'restaurant' | 'shopping-cart' | 'local-gas-station' | 'business' };
  biggestSpend: { merchant: string; amount: string; date: string };
  mostFrequent: { merchant: string; count: number; firstLetter: string };
  alerts: { icon: 'local-fire-department' | 'trending-up' | 'warning'; text: string }[];
  behaviourPatterns: { icon: 'weekend' | 'storefront' | 'access-time'; text: string }[];
  weeklyBreakdown: { best: { dateRange: string; amount: string }; worst: { dateRange: string; amount: string } };
}> = {
  may2026: {
    spendingHealth: { percentage: 85, subtext: 'of income spent this month', vsPrevious: '+3% vs Apr' },
    topCategory: { name: 'Food & Dining', amount: '₦45,000', percentage: '34% of spend', icon: 'restaurant' },
    biggestSpend: { merchant: 'Dana Air', amount: '₦75,000', date: '24 May 2026' },
    mostFrequent: { merchant: 'Shoprite', count: 12, firstLetter: 'S' },
    alerts: [
      { icon: 'trending-up', text: 'Transport spending increased by 22% this month' },
      { icon: 'local-fire-department', text: 'You spent more than usual on food this week' },
    ],
    behaviourPatterns: [
      { icon: 'weekend', text: 'Most spending happens on weekends' },
      { icon: 'storefront', text: 'Shoprite is your most frequent merchant' },
    ],
    weeklyBreakdown: {
      best: { dateRange: '08 May - 14 May', amount: '₦15,400' },
      worst: { dateRange: '15 May - 21 May', amount: '₦48,200' },
    },
  },
  apr2026: {
    spendingHealth: { percentage: 72, subtext: 'of income spent this month', vsPrevious: '-5% vs Mar' },
    topCategory: { name: 'Shopping', amount: '₦52,000', percentage: '31% of spend', icon: 'shopping-cart' },
    biggestSpend: { merchant: 'Konga', amount: '₦62,000', date: '18 Apr 2026' },
    mostFrequent: { merchant: 'Shoprite', count: 9, firstLetter: 'S' },
    alerts: [
      { icon: 'trending-up', text: 'Shopping doubled compared to last month' },
      { icon: 'warning', text: 'You exceeded your dining budget by 18%' },
    ],
    behaviourPatterns: [
      { icon: 'access-time', text: 'Most transactions happen between 6-9 PM' },
      { icon: 'storefront', text: 'Shoprite is your most frequent merchant' },
    ],
    weeklyBreakdown: {
      best: { dateRange: '05 Apr - 11 Apr', amount: '₦18,200' },
      worst: { dateRange: '19 Apr - 25 Apr', amount: '₦41,500' },
    },
  },
  mar2026: {
    spendingHealth: { percentage: 88, subtext: 'of income spent this month', vsPrevious: '+6% vs Feb' },
    topCategory: { name: 'Transport', amount: '₦38,000', percentage: '28% of spend', icon: 'local-gas-station' },
    biggestSpend: { merchant: 'Total Energies', amount: '₦55,000', date: '15 Mar 2026' },
    mostFrequent: { merchant: 'Uber', count: 16, firstLetter: 'U' },
    alerts: [
      { icon: 'trending-up', text: 'Fuel costs rose by 15% this month' },
    ],
    behaviourPatterns: [
      { icon: 'weekend', text: 'Most spending happens on weekends' },
      { icon: 'storefront', text: 'Uber is your most frequent merchant' },
    ],
    weeklyBreakdown: {
      best: { dateRange: '07 Mar - 13 Mar', amount: '₦12,800' },
      worst: { dateRange: '21 Mar - 27 Mar', amount: '₦52,100' },
    },
  },
  feb2026: {
    spendingHealth: { percentage: 65, subtext: 'of income spent this month', vsPrevious: '-10% vs Jan' },
    topCategory: { name: 'Utilities', amount: '₦42,000', percentage: '30% of spend', icon: 'business' },
    biggestSpend: { merchant: 'IKEDC', amount: '₦48,000', date: '10 Feb 2026' },
    mostFrequent: { merchant: 'Shoprite', count: 7, firstLetter: 'S' },
    alerts: [
      { icon: 'warning', text: 'Utility bills are 25% higher than last month' },
    ],
    behaviourPatterns: [
      { icon: 'access-time', text: 'Most transactions happen on weekdays' },
      { icon: 'storefront', text: 'Shoprite is your most frequent merchant' },
    ],
    weeklyBreakdown: {
      best: { dateRange: '01 Feb - 07 Feb', amount: '₦20,100' },
      worst: { dateRange: '15 Feb - 21 Feb', amount: '₦38,600' },
    },
  },
};

const categoryColorOptions = [
  { bg: '#E6EEFF', color: '#0B5CFF' },
  { bg: '#F3F0FF', color: '#6B4EFF' },
  { bg: '#EBF2FC', color: '#3377FF' },
  { bg: '#E8F0FF', color: '#001A4D' },
];

function getCategoryStyle(index: number) {
  return categoryColorOptions[index % categoryColorOptions.length];
}

export default function InsightsScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [pickerYear, setPickerYear] = useState(today.getFullYear());
  const [showFilter, setShowFilter] = useState(false);
  const [filterPos, setFilterPos] = useState({ top: 0, right: 0 });
  const filterBtnRef = useRef<View>(null);
  const windowWidth = Dimensions.get('window').width;

  const data = MOCK_DATA[monthKey(selectedYear, selectedMonth)];
  const hasEnoughData = !!data;
  const pct = data?.spendingHealth.percentage ?? 0;
  const healthColor = pct >= 80 ? theme.roles.success : pct >= 70 ? theme.roles.warning : theme.roles.error;
  const catStyle = getCategoryStyle(selectedMonth);
  const selectedLabel = `${MONTH_NAMES[selectedMonth]} ${selectedYear}`;

  const openFilter = () => {
    filterBtnRef.current?.measureInWindow((x, y, width, height) => {
      setFilterPos({ top: y + height + 4, right: windowWidth - x - width });
      setShowFilter(true);
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      <View style={[styles.headerContainer, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Insights</Text>
            <Text style={styles.headerSubtitle}>Track your spending trends</Text>
          </View>
          <TouchableOpacity
            ref={filterBtnRef}
            style={styles.filterDropdownBtn}
            onPress={openFilter}
            activeOpacity={0.8}
          >
            <Text style={styles.filterDropdownText}>
              {selectedLabel}
            </Text>
            <MaterialIcons name="expand-more" size={18} color="#001133" />
          </TouchableOpacity>
        </View>
      </View>

      {showFilter && (
        <TouchableOpacity
          style={styles.notifOverlay}
          activeOpacity={1}
          onPress={() => setShowFilter(false)}
        >
          <View style={[styles.monthPicker, { top: filterPos.top, right: filterPos.right }]}>
            {/* Year Header */}
            <View style={styles.yearHeader}>
              <TouchableOpacity onPress={() => setPickerYear(pickerYear - 1)} style={styles.yearArrow} activeOpacity={0.7}>
                <MaterialIcons name="chevron-left" size={22} color="#001133" />
              </TouchableOpacity>
              <Text style={styles.yearText}>{pickerYear}</Text>
              <TouchableOpacity onPress={() => setPickerYear(pickerYear + 1)} style={styles.yearArrow} activeOpacity={0.7}>
                <MaterialIcons name="chevron-right" size={22} color="#001133" />
              </TouchableOpacity>
            </View>

            {/* Month Grid */}
            <View style={styles.monthGrid}>
              {MONTH_NAMES.map((name, i) => {
                const isSelected = selectedYear === pickerYear && selectedMonth === i;
                return (
                  <TouchableOpacity
                    key={name}
                    style={[styles.monthCell, isSelected && styles.monthCellSelected]}
                    onPress={() => {
                      setSelectedYear(pickerYear);
                      setSelectedMonth(i);
                      setShowFilter(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.monthCellText, isSelected && styles.monthCellTextSelected]}>
                      {name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </TouchableOpacity>
      )}

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {hasEnoughData ? (
          <View style={styles.activeLayout}>
            {/* 1. Financial Health Score */}
            <View style={[styles.card, styles.healthCard, Shadows.sm]}>
              <Text style={styles.cardLabel}>Spending Health</Text>
              <View style={styles.healthCenter}>
                <Text style={[styles.healthPercentage, { color: healthColor }]}>
                  {data.spendingHealth.percentage}%
                </Text>
                <Text style={styles.healthSubtext}>{data.spendingHealth.subtext}</Text>
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
                {data.spendingHealth.vsPrevious}
              </Text>
            </View>

            {/* 2. Top Category & Biggest Spend */}
            <View style={styles.sideBySideContainer}>
              <View style={[styles.sideCard, { backgroundColor: catStyle.bg }]}>
                <Text style={[styles.categoryLabel, { color: catStyle.color }]}>Top Category</Text>
                <View style={[styles.categoryIconCircle, { backgroundColor: '#FFFFFF' }]}>
                  <MaterialIcons name={data.topCategory.icon} size={18} color={catStyle.color} />
                </View>
                <Text style={[styles.categoryName, { color: '#001133' }]} numberOfLines={1}>
                  {data.topCategory.name}
                </Text>
                <Text style={[styles.categoryAmount, { color: '#001133' }]} numberOfLines={1}>
                  <Text style={styles.nairaSymbol}>₦</Text>
                  {data.topCategory.amount.replace('₦', '')}
                </Text>
                <Text style={[styles.categorySubtext, { color: catStyle.color }]}>
                  {data.topCategory.percentage}
                </Text>
              </View>

              <View style={[styles.sideCard, styles.spendCard]}>
                <Text style={styles.spendLabel}>Biggest Spend</Text>
                <View style={styles.spendIconCircle}>
                  <MaterialIcons name="local-airport" size={18} color="#D30000" />
                </View>
                <Text style={styles.spendMerchant} numberOfLines={1}>
                  {data.biggestSpend.merchant}
                </Text>
                <Text style={styles.spendAmount} numberOfLines={1}>
                  <Text style={styles.nairaSymbol}>₦</Text>
                  {data.biggestSpend.amount.replace('₦', '')}
                </Text>
                <Text style={styles.spendSubtext}>{data.biggestSpend.date}</Text>
              </View>
            </View>

            {/* 3. Alerts */}
            <View style={[styles.card, Shadows.sm]}>
              <Text style={styles.cardLabel}>Alerts</Text>
              <View style={styles.alertsContainer}>
                {data.alerts.map((alert, i) => (
                  <View key={i} style={styles.alertRow}>
                    <View style={styles.alertIconCircle}>
                      <MaterialIcons name={alert.icon} size={16} color="#D30000" />
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
                {data.behaviourPatterns.map((pattern, i) => (
                  <View key={i} style={[styles.behaviourRow, i < data.behaviourPatterns.length - 1 && styles.behaviourRowBorder]}>
                    <View style={styles.behaviourIconCircle}>
                      <MaterialIcons name={pattern.icon} size={18} color="#0B5CFF" />
                    </View>
                    <Text style={styles.behaviourText}>{pattern.text}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* 5. Weekly Breakdown */}
            <View style={[styles.card, styles.weeklyCard, Shadows.sm]}>
              <Text style={styles.weeklyLabel}>Weekly Breakdown</Text>
              <View style={styles.weeklyRow}>
                <View style={[styles.weeklyArrowCircle, { backgroundColor: '#E8F8EE' }]}>
                  <MaterialIcons name="arrow-upward" size={16} color="#00BD00" />
                </View>
                <View style={styles.weeklyRowDetails}>
                  <Text style={styles.weeklyRowTitle}>Best Week</Text>
                  <Text style={styles.weeklyRowDate}>{data.weeklyBreakdown.best.dateRange}</Text>
                </View>
                <Text style={[styles.weeklyAmount, { color: '#00BD00' }]}>
                  <Text style={styles.nairaSymbol}>₦</Text>
                  {data.weeklyBreakdown.best.amount.replace('₦', '')}
                </Text>
              </View>
              <View style={styles.weeklyDivider} />
              <View style={styles.weeklyRow}>
                <View style={[styles.weeklyArrowCircle, { backgroundColor: '#FDECEB' }]}>
                  <MaterialIcons name="arrow-downward" size={16} color="#D30000" />
                </View>
                <View style={styles.weeklyRowDetails}>
                  <Text style={styles.weeklyRowTitle}>Worst Week</Text>
                  <Text style={styles.weeklyRowDate}>{data.weeklyBreakdown.worst.dateRange}</Text>
                </View>
                <Text style={[styles.weeklyAmount, { color: '#D30000' }]}>
                  <Text style={styles.nairaSymbol}>₦</Text>
                  {data.weeklyBreakdown.worst.amount.replace('₦', '')}
                </Text>
              </View>
            </View>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFC',
  },
  headerContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 5,
      },
      android: { elevation: 2 },
    }),
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerTitle: {
    fontFamily: Typography.fonts.display,
    fontSize: 24,
    color: '#001133',
  },
  headerSubtitle: {
    fontFamily: Typography.fonts.body,
    fontSize: 14,
    color: '#7B786F',
    marginTop: -2,
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
  notifOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 999,
  },
  monthPicker: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    width: 220,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
    }),
  },
  yearHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  yearArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  yearText: {
    fontFamily: Typography.fonts.display,
    fontSize: 16,
    color: '#001133',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  monthCell: {
    width: '33.333%',
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthCellSelected: {
    backgroundColor: '#0B5CFF',
    borderRadius: Radius.full,
    width: '33.333%',
    paddingVertical: 8,
    alignSelf: 'center',
  },
  monthCellText: {
    fontFamily: Typography.fonts.body,
    fontSize: 13,
    color: '#001133',
  },
  monthCellTextSelected: {
    fontFamily: Typography.fonts.medium,
    color: '#FFFFFF',
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
    textAlign: 'center',
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
  nairaSymbol: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontWeight: '700',
  },
});
