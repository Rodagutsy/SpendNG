import React from 'react';
import { Tabs } from 'expo-router';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { HouseSimpleIcon, LightningIcon, PiggyBankIcon, UserIcon } from '@/components/ui/CustomSvgIcon';
import { Colors, Typography, Shadows } from '@/constants/Tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';

function CustomTabBar({ state, descriptors, navigation }: any) {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  return (
    <View style={[styles.tabBarContainer, Shadows.large, { backgroundColor: theme.surface }]}>
      {state.routes.map((route: any, index: number) => {
        // Only render known tab routes — skip all auto-discovered sub-pages
        const VISIBLE_TABS = ['index', 'transactions/index', 'insights/index', 'settings'];
        if (!VISIBLE_TABS.includes(route.name)) return null;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!event.defaultPrevented) {
            navigation.navigate(route.name, { screen: 'index' });
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

        const activeColor = theme.primary;
        const inactiveColor = theme.outline;

        if (route.name === 'index') {
          icon = <HouseSimpleIcon size={20} color={isFocused ? activeColor : inactiveColor} />;
          label = 'Home';
        } else if (route.name === 'transactions/index') {
          icon = <PiggyBankIcon size={20} color={isFocused ? activeColor : inactiveColor} />;
          label = 'Activity';
        } else if (route.name === 'insights/index') {
          icon = <LightningIcon size={20} color={isFocused ? activeColor : inactiveColor} />;
          label = 'Insights';
        } else if (route.name === 'settings') {
          icon = <UserIcon size={20} color={isFocused ? activeColor : inactiveColor} />;
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
              <View style={[styles.activePill, { backgroundColor: theme.primaryContainer }]}>
                {icon}
                <Text style={[styles.activeLabel, { color: theme.primary }]}>{label}</Text>
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
        name="transactions/index"
        options={{
          title: 'Activity',
        }}
      />
      <Tabs.Screen
        name="insights/index"
        options={{
          title: 'Insights',
        }}
      />
      <Tabs.Screen
        name="settings"
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
        name="tax-prep"
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
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: Platform.OS === 'ios' ? 28 : 10,
    paddingTop: 10,
    paddingHorizontal: 16,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    gap: 4,
  },
  activeLabel: {
    fontFamily: Typography.fonts.medium,
    fontSize: 14,
    fontWeight: 'black'
  },
  inactiveIconWrapper: {
    padding: 8,
  },
});
