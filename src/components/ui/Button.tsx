import { TouchableOpacity, Text, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { colors, borderRadius, spacing, fontSize, fontWeight } from '@/lib/theme';
import { useIsDark } from '@/stores/useSettingsStore';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  textStyle,
}: ButtonProps) {
  const isDark = useIsDark();

  const sizeStyles = {
    sm: { py: spacing.sm, px: spacing.md },
    md: { py: spacing.md - 4, px: spacing.lg },
    lg: { py: spacing.md, px: spacing.xl },
  };

  const variantStyles: Record<string, ViewStyle> = {
    primary: {
      backgroundColor: colors.light.primary,
    },
    secondary: {
      backgroundColor: isDark ? colors.dark.surfaceSecondary : colors.light.surfaceSecondary,
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: isDark ? colors.dark.border : colors.light.border,
    },
    ghost: {
      backgroundColor: 'transparent',
    },
  };

  const textVariantStyles: Record<string, TextStyle> = {
    primary: { color: '#FFFFFF' },
    secondary: { color: isDark ? colors.dark.text : colors.light.text },
    outline: { color: isDark ? colors.dark.text : colors.light.text },
    ghost: { color: colors.light.primary },
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[
        {
          borderRadius: borderRadius.md,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          paddingVertical: sizeStyles[size].py,
          paddingHorizontal: sizeStyles[size].px,
        },
        variantStyles[variant],
        disabled && { opacity: 0.5 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? '#FFFFFF' : isDark ? colors.dark.text : colors.light.text}
          size="small"
        />
      ) : (
        <Text
          style={[
            {
              fontSize: size === 'sm' ? fontSize.sm : size === 'lg' ? fontSize.lg : fontSize.md,
              fontWeight: fontWeight.semibold,
            },
            textVariantStyles[variant],
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}
