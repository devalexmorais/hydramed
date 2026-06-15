import { View, ViewStyle } from 'react-native';
import { colors, borderRadius, spacing } from '@/lib/theme';
import { useIsDark } from '@/stores/useSettingsStore';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated';
}

export function Card({ children, style, variant = 'default' }: CardProps) {
  const isDark = useIsDark();

  return (
    <View
      style={[
        {
          backgroundColor: isDark ? colors.dark.surface : colors.light.surface,
          borderRadius: borderRadius.lg,
          padding: spacing.md,
          borderWidth: 1,
          borderColor: isDark ? colors.dark.border : colors.light.border,
        },
        variant === 'elevated' && {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 4,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
