import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '@/constants/Tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export interface AlertButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

export interface AlertConfig {
  title: string;
  message?: string;
  buttons?: AlertButton[];
}

interface AlertModalProps {
  visible: boolean;
  config: AlertConfig | null;
  onClose: () => void;
}

export function AlertModal({ visible, config, onClose }: AlertModalProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  if (!config) return null;

  const buttons = config.buttons?.length ? config.buttons : [{ text: 'OK', style: 'default' as const }];

  const handlePress = (button: AlertButton) => {
    button.onPress?.();
    onClose();
  };

  const btnStyles = (index: number, style?: 'default' | 'cancel' | 'destructive') => {
    if (index === 0) {
      const bg = style === 'destructive' ? theme.roles.error : theme.primary;
      return { backgroundColor: bg, borderWidth: 0 };
    }
    return { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: style === 'destructive' ? theme.roles.error : theme.outlineVariant };
  };

  const btnTextColor = (index: number, style?: 'default' | 'cancel' | 'destructive') => {
    if (index === 0) return theme.onPrimary;
    return style === 'destructive' ? theme.roles.error : theme.outline;
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={[styles.container, { backgroundColor: theme.roles.surface }]} activeOpacity={1} onPress={() => { }}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <MaterialIcons name="close" size={20} color={theme.outline} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.roles.onSurface }]}>{config.title}</Text>
          {config.message ? (
            <Text style={[styles.message, { color: theme.outline }]}>{config.message}</Text>
          ) : null}
          <View style={styles.buttonRow}>
            {buttons.slice(0, 2).map((button, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.button, btnStyles(i, button.style)]}
                onPress={() => handlePress(button)}
                activeOpacity={0.7}
              >
                <Text style={[styles.buttonText, { color: btnTextColor(i, button.style) }]}>
                  {button.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  container: {
    width: '70%',
    maxWidth: 300,
    borderRadius: Radius.sm,
    padding: 24,
    paddingTop: 48,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 20,
    zIndex: 1,
  },
  title: {
    fontFamily: Typography.fonts.medium,
    fontSize: Typography.sizes.titleS,
    marginBottom: 4,
    textAlign: 'center',
  },
  message: {
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.bodyM,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing[2],
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
  },
  buttonText: {
    fontFamily: Typography.fonts.medium,
    fontSize: Typography.sizes.buttonM,
    textAlign: 'center',
  },
});
