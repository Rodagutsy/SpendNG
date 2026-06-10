import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '@/constants/Tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';

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

  const bgColor = (style?: 'default' | 'cancel' | 'destructive') => {
    if (style === 'destructive') return 'transparent';
    if (style === 'cancel') return 'transparent';
    return theme.primary;
  };

  const textColor = (style?: 'default' | 'cancel' | 'destructive') => {
    if (style === 'destructive') return theme.roles.error;
    if (style === 'cancel') return theme.outline;
    return theme.onPrimary;
  };

  const borderColor = (style?: 'default' | 'cancel' | 'destructive') => {
    if (style === 'destructive') return theme.roles.error;
    if (style === 'cancel') return theme.outlineVariant;
    return 'transparent';
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={[styles.container, { backgroundColor: theme.roles.surface }]} activeOpacity={1} onPress={() => {}}>
          <Text style={[styles.title, { color: theme.roles.onSurface }]}>{config.title}</Text>
          {config.message ? (
            <Text style={[styles.message, { color: theme.outline }]}>{config.message}</Text>
          ) : null}
          <View style={styles.buttonRow}>
            {buttons.map((button, i) => (
              <TouchableOpacity
                key={i}
                style={[
                  styles.button,
                  { backgroundColor: bgColor(button.style), borderColor: borderColor(button.style), borderWidth: button.style === 'destructive' || button.style === 'cancel' ? 1.5 : 0 },
                ]}
                onPress={() => handlePress(button)}
                activeOpacity={0.7}
              >
                <Text style={[styles.buttonText, { color: textColor(button.style) }]}>
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
    width: '85%',
    maxWidth: 340,
    borderRadius: 24,
    padding: 24,
  },
  title: {
    fontFamily: Typography.fonts.display,
    fontSize: Typography.sizes.titleS,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.bodyM,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontFamily: Typography.fonts.medium,
    fontSize: Typography.sizes.buttonM,
  },
});
