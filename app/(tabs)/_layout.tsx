import React from 'react';
import { Tabs } from 'expo-router';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { HouseSimpleIcon, LightningIcon, PiggyBankIcon, UserIcon } from '@/components/ui/CustomSvgIcon';
import { Colors } from '@/constants/Tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';

function CustomTabBar({ state, descriptors, navigation }: any) {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  return (
    <View style={[styles.tabBarContainer, { backgroundColor: theme.surface, borderTopColor: theme.outlineVariant }]}>
      {state.routes.map((route: any, index: number) => {
        // Skip hidden routes (export, transactions/[id])
        if (route.name === 'export' || route.name === 'transactions/[id]') return null;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        // Match the exact route mapping and tab labels
        let icon = null;
        let label = '';
        
        if (route.name === 'index') {
          icon = <HouseSimpleIcon size={20} color={isFocused ? '#003399' : '#7B786F'} />;
          label = 'Home';
        } else if (route.name === 'insights/index') {
          icon = <LightningIcon size={20} color={isFocused ? '#003399' : '#7B786F'} />;
          label = 'Insight';
        } else if (route.name === 'transactions/index') {
          icon = <PiggyBankIcon size={20} color={isFocused ? '#003399' : '#7B786F'} />;
          label = 'Savings';
        } else if (route.name === 'settings/index') {
          icon = <UserIcon size={20} color={isFocused ? '#003399' : '#7B786F'} />;
          label = 'Profile';
        }

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tabButton}
            activeOpacity={0.8}
          >
            {isFocused ? (
              <View style={styles.activePill}>
                {icon}
                <Text style={styles.activeLabel}>{label}</Text>
              </View>
            ) : (
              <View style={styles.inactiveIconWrapper}>
                {icon}
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="insights/index"
        options={{
          title: 'Insight',
        }}
      />
      <Tabs.Screen
        name="transactions/index"
        options={{
          title: 'Transactions',
        }}
      />
      <Tabs.Screen
        name="settings/index"
        options={{
          title: 'Settings',
        }}
      />
      {/* Hidden screens */}
      <Tabs.Screen
        name="export"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="transactions/[id]"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    height: Platform.OS === 'ios' ? 96 : 76,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: Platform.OS === 'ios' ? 28 : 10,
    paddingTop: 10,
    paddingHorizontal: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF2FC',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    gap: 8,
  },
  activeLabel: {
    color: '#003399',
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
  },
  inactiveIconWrapper: {
    padding: 8,
  },
});
