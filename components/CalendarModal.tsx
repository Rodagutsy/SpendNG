import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Colors, Typography, Spacing, Radius } from '@/constants/Tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

interface CalendarModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectDate: (date: Date) => void;
  initialDate?: Date;
}

export const CalendarModal: React.FC<CalendarModalProps> = ({ visible, onClose, onSelectDate, initialDate }) => {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const styles = createStyles(theme);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [viewYear, setViewYear] = useState(initialDate?.getFullYear() ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate?.getMonth() ?? today.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date | null>(initialDate ?? null);

  useEffect(() => {
    if (visible && initialDate) {
      setViewYear(initialDate.getFullYear());
      setViewMonth(initialDate.getMonth());
      setSelectedDate(initialDate);
    }
  }, [visible, initialDate]);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const startDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewYear(viewYear - 1);
      setViewMonth(11);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewYear(viewYear + 1);
      setViewMonth(0);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    d.setHours(0, 0, 0, 0);
    setSelectedDate(d);
    onSelectDate(d);
    onClose();
  };

  const rows: React.ReactNode[] = [];
  const dayCells: React.ReactNode[] = [];
  let dayCount = 1;

  for (let i = 0; i < startDayOfWeek; i++) {
    dayCells.push(<View key={`empty-${i}`} style={styles.dayCell} />);
  }

  while (dayCount <= daysInMonth) {
    if (dayCells.length % 7 === 0 && dayCells.length > 0) {
      rows.push(
        <View key={`row-${rows.length}`} style={styles.weekRow}>
          {dayCells.splice(0, 7)}
        </View>,
      );
    }
    const currentDay = dayCount;
    const cellDate = new Date(viewYear, viewMonth, currentDay);
    cellDate.setHours(0, 0, 0, 0);
    const isSelected = selectedDate && cellDate.getTime() === selectedDate.getTime();
    const isToday = cellDate.getTime() === today.getTime();

    dayCells.push(
      <TouchableOpacity
        key={`day-${currentDay}`}
        style={[
          styles.dayCell,
          isSelected && styles.daySelected,
        ]}
        onPress={() => handleSelectDay(currentDay)}
        activeOpacity={0.7}
      >
        <View style={[
          styles.dayInner,
          isToday && styles.dayToday,
          isSelected && styles.daySelectedInner,
        ]}>
          <Text style={[
            styles.dayText,
            isToday && styles.dayTextToday,
            isSelected && styles.dayTextSelected,
          ]}>
            {currentDay}
          </Text>
        </View>
      </TouchableOpacity>,
    );

    dayCount++;
  }

  if (dayCells.length > 0) {
    while (dayCells.length % 7 !== 0) {
      dayCells.push(<View key={`trailing-${dayCells.length}`} style={styles.dayCell} />);
    }
    rows.push(
      <View key={`row-${rows.length}`} style={styles.weekRow}>
        {dayCells.splice(0, 7)}
      </View>,
    );
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={styles.container} activeOpacity={1} onPress={() => {}}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={prevMonth} style={styles.navBtn} activeOpacity={0.7}>
              <MaterialIcons name="chevron-left" size={24} color={theme.onBackground} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {MONTHS[viewMonth]} {viewYear}
            </Text>
            <TouchableOpacity onPress={nextMonth} style={styles.navBtn} activeOpacity={0.7}>
              <MaterialIcons name="chevron-right" size={24} color={theme.onBackground} />
            </TouchableOpacity>
          </View>

          {/* Weekday Headers */}
          <View style={styles.weekRow}>
            {WEEKDAYS.map((d, i) => (
              <View key={d} style={styles.dayCell}>
                <Text style={[styles.weekdayText, i === 0 || i === 6 ? { color: theme.error } : { color: theme.outline }]}>
                  {d}
                </Text>
              </View>
            ))}
          </View>

          {/* Date Grid */}
          {rows}

          {/* Footer */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.closeBtnText}>Cancel</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const createStyles = (theme: typeof Colors.light) => StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  container: {
    width: '85%',
    maxWidth: 340,
    backgroundColor: theme.surface,
    borderRadius: Radius.lg,
    paddingVertical: Spacing[5],
    paddingHorizontal: Spacing[4],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing[5],
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: Typography.fonts.display,
    fontSize: Typography.sizes.titleM,
    color: theme.onBackground,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: Spacing[1],
  },
  weekdayText: {
    fontFamily: Typography.fonts.medium,
    fontSize: Typography.sizes.labelS,
    textAlign: 'center',
  },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
  },
  dayInner: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayToday: {
    borderWidth: 1.5,
    borderColor: theme.primary,
  },
  daySelected: {},
  daySelectedInner: {
    backgroundColor: theme.primary,
  },
  dayText: {
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.bodyM,
    color: theme.onBackground,
  },
  dayTextToday: {
    fontFamily: Typography.fonts.medium,
    color: theme.primary,
  },
  dayTextSelected: {
    color: theme.onPrimary,
    fontFamily: Typography.fonts.medium,
  },
  closeBtn: {
    marginTop: Spacing[4],
    alignItems: 'center',
    paddingVertical: Spacing[3],
    borderRadius: Radius.full,
    backgroundColor: theme.ripple,
  },
  closeBtnText: {
    fontFamily: Typography.fonts.medium,
    fontSize: Typography.sizes.buttonM,
    color: theme.onBackground,
  },
});
