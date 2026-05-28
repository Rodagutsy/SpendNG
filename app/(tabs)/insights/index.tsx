import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Dimensions,
  StatusBar
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Shadows, Spacing, Radius } from '@/constants/Tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { BellIcon } from '@/components/ui/CustomSvgIcon';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function InsightsScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  // Sleek interactive state switcher for verifying active and empty states
  const [hasEnoughData, setHasEnoughData] = useState(true);

  // Mock data matching the specifications
  const activeData = {
    monthYear: 'May 2026',
    spendingHealth: {
      percentage: 85,
      subtext: 'of income spent this month',
    },
    topCategory: {
      name: 'Food & Dining',
      amount: '₦45,000',
      percentage: '34% of spend',
      icon: 'restaurant' as const,
    },
    biggestSpend: {
      merchant: 'Dana Air',
      amount: '₦75,000',
      date: '24 May 2026',
    },
    mostFrequent: {
      merchant: 'Shoprite',
      count: 12,
      firstLetter: 'S',
    },
    weeklyBreakdown: {
      best: {
        dateRange: '08 May - 14 May',
        amount: '₦15,400',
      },
      worst: {
        dateRange: '15 May - 21 May',
        amount: '₦48,200',
      }
    }
  };

  // Helper to dynamically color-code spending health progress bar
  const getSpendingHealthColor = (percentage: number) => {
    if (percentage < 70) return '#00BD00'; // Green
    if (percentage <= 90) return '#FFA000'; // Amber/Yellow
    return '#D30000'; // Red
  };

  const healthColor = getSpendingHealthColor(activeData.spendingHealth.percentage);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      {/* Screen Header */}
      <View style={[styles.headerContainer, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Insights</Text>
            <Text style={styles.headerSubtitle}>{activeData.monthYear}</Text>
          </View>
          <TouchableOpacity
            style={[styles.notificationBtn, Shadows.sm]}
            activeOpacity={0.8}
          >
            <BellIcon size={24} color="#001133" />
          </TouchableOpacity>
        </View>

        {/* Premium Segmented Toggle to Switch States for Testing */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[
              styles.toggleTab,
              hasEnoughData && styles.toggleTabActive
            ]}
            onPress={() => setHasEnoughData(true)}
            activeOpacity={0.9}
          >
            <Text style={[
              styles.toggleTabText,
              hasEnoughData && styles.toggleTabTextActive
            ]}>
              Active Insights
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleTab,
              !hasEnoughData && styles.toggleTabActive
            ]}
            onPress={() => setHasEnoughData(false)}
            activeOpacity={0.9}
          >
            <Text style={[
              styles.toggleTabText,
              !hasEnoughData && styles.toggleTabTextActive
            ]}>
              Empty State
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content Area */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {hasEnoughData ? (
          <View style={styles.activeLayout}>
            {/* Card 1 — Spending Health (full width) */}
            <View style={[styles.card, styles.healthCard, Shadows.sm]}>
              <Text style={styles.cardLabel}>Spending Health</Text>
              
              <View style={styles.healthCenter}>
                <Text style={[styles.healthPercentage, { color: healthColor }]}>
                  {activeData.spendingHealth.percentage}%
                </Text>
                <Text style={styles.healthSubtext}>
                  {activeData.spendingHealth.subtext}
                </Text>
              </View>

              {/* Progress bar */}
              <View style={styles.progressBarBg}>
                <View 
                  style={[
                    styles.progressBarFill, 
                    { 
                      width: `${activeData.spendingHealth.percentage}%`,
                      backgroundColor: healthColor 
                    }
                  ]} 
                />
              </View>
            </View>

            {/* Card 2 & 3 — Side by side */}
            <View style={styles.sideBySideContainer}>
              {/* Card 2: Top Category (Green Tint) */}
              <View style={[styles.sideCard, styles.categoryCard]}>
                <Text style={styles.categoryLabel}>Top Category</Text>
                
                <View style={styles.categoryIconCircle}>
                  <MaterialIcons name={activeData.topCategory.icon} size={18} color="#007D3A" />
                </View>

                <Text style={styles.categoryName} numberOfLines={1}>
                  {activeData.topCategory.name}
                </Text>
                
                <Text style={styles.categoryAmount} numberOfLines={1}>
                  <Text style={styles.nairaSymbol}>₦</Text>
                  {activeData.topCategory.amount.replace('₦', '')}
                </Text>

                <Text style={styles.categorySubtext}>
                  {activeData.topCategory.percentage}
                </Text>
              </View>

              {/* Card 3: Biggest Spend (Red Tint) */}
              <View style={[styles.sideCard, styles.spendCard]}>
                <Text style={styles.spendLabel}>Biggest Spend</Text>
                
                <View style={styles.spendIconCircle}>
                  <MaterialIcons name="local-airport" size={18} color="#D30000" />
                </View>

                <Text style={styles.spendMerchant} numberOfLines={1}>
                  {activeData.biggestSpend.merchant}
                </Text>
                
                <Text style={styles.spendAmount} numberOfLines={1}>
                  <Text style={styles.nairaSymbol}>₦</Text>
                  {activeData.biggestSpend.amount.replace('₦', '')}
                </Text>

                <Text style={styles.spendSubtext}>
                  {activeData.biggestSpend.date}
                </Text>
              </View>
            </View>

            {/* Card 4 — Most Visited Merchant (full width) */}
            <View style={[styles.card, styles.frequentCard, Shadows.sm]}>
              <View style={styles.frequentHeaderRow}>
                <View style={styles.merchantLogoCircle}>
                  <Text style={styles.merchantLogoText}>
                    {activeData.mostFrequent.firstLetter}
                  </Text>
                </View>
                <View style={styles.frequentDetails}>
                  <Text style={styles.frequentLabel}>Most Frequent</Text>
                  <Text style={styles.frequentMerchantName}>
                    {activeData.mostFrequent.merchant}
                  </Text>
                  <Text style={styles.frequentSubtext}>
                    You've transacted here {activeData.mostFrequent.count} times this month
                  </Text>
                </View>
              </View>
            </View>

            {/* Card 5 — Best vs Worst Week (full width) */}
            <View style={[styles.card, styles.weeklyCard, Shadows.sm]}>
              <Text style={styles.weeklyLabel}>Weekly Breakdown</Text>
              
              {/* Best Week Row */}
              <View style={styles.weeklyRow}>
                <View style={[styles.weeklyArrowCircle, { backgroundColor: '#E8F8EE' }]}>
                  <MaterialIcons name="arrow-upward" size={16} color="#00BD00" />
                </View>
                <View style={styles.weeklyRowDetails}>
                  <Text style={styles.weeklyRowTitle}>Best Week</Text>
                  <Text style={styles.weeklyRowDate}>{activeData.weeklyBreakdown.best.dateRange}</Text>
                </View>
                <Text style={[styles.weeklyAmount, { color: '#00BD00' }]}>
                  <Text style={styles.nairaSymbol}>₦</Text>
                  {activeData.weeklyBreakdown.best.amount.replace('₦', '')}
                </Text>
              </View>

              <View style={styles.weeklyDivider} />

              {/* Worst Week Row */}
              <View style={styles.weeklyRow}>
                <View style={[styles.weeklyArrowCircle, { backgroundColor: '#FDECEB' }]}>
                  <MaterialIcons name="arrow-downward" size={16} color="#D30000" />
                </View>
                <View style={styles.weeklyRowDetails}>
                  <Text style={styles.weeklyRowTitle}>Worst Week</Text>
                  <Text style={styles.weeklyRowDate}>{activeData.weeklyBreakdown.worst.dateRange}</Text>
                </View>
                <Text style={[styles.weeklyAmount, { color: '#D30000' }]}>
                  <Text style={styles.nairaSymbol}>₦</Text>
                  {activeData.weeklyBreakdown.worst.amount.replace('₦', '')}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          /* Empty State View */
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
    backgroundColor: '#F9FAFC', // Premium light-gray screen background
  },
  headerContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 5,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 24,
    color: '#001133',
    fontWeight: '700',
  },
  headerSubtitle: {
    fontFamily: 'Poppins',
    fontSize: 14,
    color: '#7B786F',
    marginTop: -2,
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F2F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F2F6',
    borderRadius: Radius.md,
    padding: 4,
    height: 44,
  },
  toggleTab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Radius.md - 2,
  },
  toggleTabActive: {
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  toggleTabText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    color: '#7B786F',
  },
  toggleTabTextActive: {
    color: '#001133',
    fontFamily: 'Poppins-SemiBold',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 120 : 100, // Safe padding below tab bar
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
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: '#7B786F',
    fontWeight: '600',
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
    fontFamily: 'Poppins-Bold',
    fontSize: 48,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  healthSubtext: {
    fontFamily: 'Poppins',
    fontSize: 14,
    color: '#7B786F',
    marginTop: 4,
  },
  progressBarBg: {
    width: '100%',
    height: 6,
    backgroundColor: '#F0F0F0',
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
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
  categoryCard: {
    backgroundColor: '#E8F8EE', // Light green tint
  },
  categoryLabel: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 12,
    color: '#007D3A',
    fontWeight: '600',
  },
  categoryIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 8,
  },
  categoryName: {
    fontFamily: 'Poppins-Bold',
    fontSize: 15,
    color: '#001133',
    fontWeight: '700',
  },
  categoryAmount: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: '#001133',
    fontWeight: '700',
    marginTop: 2,
  },
  categorySubtext: {
    fontFamily: 'Poppins',
    fontSize: 11,
    color: '#007D3A',
    opacity: 0.8,
    marginTop: 2,
  },
  spendCard: {
    backgroundColor: '#FDECEB', // Light red tint
  },
  spendLabel: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 12,
    color: '#D30000',
    fontWeight: '600',
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
    fontFamily: 'Poppins-Bold',
    fontSize: 15,
    color: '#001133',
    fontWeight: '700',
  },
  spendAmount: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: '#D30000',
    fontWeight: '700',
    marginTop: 2,
  },
  spendSubtext: {
    fontFamily: 'Poppins',
    fontSize: 11,
    color: '#D30000',
    opacity: 0.8,
    marginTop: 2,
  },
  frequentCard: {
    backgroundColor: '#F1F2F6', // Subtle grey background
    padding: 16,
  },
  frequentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  merchantLogoCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  merchantLogoText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    color: '#0B5CFF',
    fontWeight: '700',
  },
  frequentDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  frequentLabel: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 11,
    color: '#7B786F',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  frequentMerchantName: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: '#001133',
    fontWeight: '700',
    marginTop: 2,
  },
  frequentSubtext: {
    fontFamily: 'Poppins',
    fontSize: 13,
    color: '#7B786F',
    marginTop: 4,
  },
  weeklyCard: {
    paddingBottom: 8,
  },
  weeklyLabel: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: '#7B786F',
    fontWeight: '600',
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
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: '#001133',
    fontWeight: '600',
  },
  weeklyRowDate: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: '#7B786F',
    marginTop: 2,
  },
  weeklyAmount: {
    fontFamily: 'Poppins-Bold',
    fontSize: 15,
    fontWeight: '700',
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
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: '#001133',
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyText: {
    fontFamily: 'Poppins',
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
