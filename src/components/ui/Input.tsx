import { View, TextInput, Text, TextInputProps, ViewStyle } from 'react-native';
import { colors, borderRadius, spacing, fontSize, fontWeight } from '@/lib/theme';
import { useIsDark } from '@/stores/useSettingsStore';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export function Input({ label, error, containerStyle, style, ...props }: InputProps) {
  const isDark = useIsDark();

  return (
    <View style={[{ marginBottom: spacing.md }, containerStyle]}>
      {label && (
        <Text
          style={{
            fontSize: fontSize.sm,
            fontWeight: fontWeight.medium,
            color: isDark ? colors.dark.textSecondary : colors.light.textSecondary,
            marginBottom: spacing.xs,
          }}
        >
          {label}
        </Text>
      )}
      <TextInput
        placeholderTextColor={isDark ? colors.dark.textTertiary : colors.light.textTertiary}
        style={[
          {
            backgroundColor: isDark ? colors.dark.surfaceSecondary : colors.light.surfaceSecondary,
            borderRadius: borderRadius.md,
            padding: spacing.md,
            fontSize: fontSize.md,
            color: isDark ? colors.dark.text : colors.light.text,
            borderWidth: 1,
            borderColor: error
              ? colors.light.danger
              : isDark
              ? colors.dark.border
              : colors.light.border,
          },
          style,
        ]}
        {...props}
      />
      {error && (
        <Text
          style={{
            fontSize: fontSize.xs,
            color: colors.light.danger,
            marginTop: spacing.xs,
          }}
        >
          {error}
        </Text>
      )}
    </View>
  );
}
