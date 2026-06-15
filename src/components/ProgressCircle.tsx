import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, fontSize, fontWeight } from '@/lib/theme';
import { useIsDark } from '@/stores/useSettingsStore';

interface ProgressCircleProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
  sublabel?: string;
  centerText?: string;
  centerSubtext?: string;
  children?: React.ReactNode;
}

export function ProgressCircle({
  progress,
  size = 160,
  strokeWidth = 12,
  color,
  label,
  sublabel,
  centerText,
  centerSubtext,
  children,
}: ProgressCircleProps) {
  const isDark = useIsDark();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.min(Math.max(progress, 0), 100);
  const strokeDashoffset = circumference - (clampedProgress / 100) * circumference;
  const progressColor = color || colors.light.primary;

  const calculatedFontSize = centerText
    ? Math.max(Math.round(size * 0.15), 14)
    : Math.round(size * 0.2);

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={isDark ? colors.dark.surfaceSecondary : colors.light.surfaceSecondary}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={progressColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View
        style={{
          position: 'absolute',
          alignItems: 'center',
          justifyContent: 'center',
          width: size - strokeWidth * 2,
          height: size - strokeWidth * 2,
        }}
      >
        {children ? (
          children
        ) : (
          <>
            <Text
              style={{
                fontSize: calculatedFontSize,
                fontWeight: fontWeight.bold,
                color: isDark ? colors.dark.text : colors.light.text,
                textAlign: 'center',
              }}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {centerText || `${Math.round(clampedProgress)}%`}
            </Text>
            {centerSubtext && (
              <Text
                style={{
                  fontSize: Math.max(Math.round(size * 0.08), 10),
                  color: isDark ? colors.dark.textTertiary : colors.light.textTertiary,
                  marginTop: 2,
                  textAlign: 'center',
                }}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {centerSubtext}
              </Text>
            )}
            {label && (
              <Text
                style={{
                  fontSize: fontSize.sm,
                  color: isDark ? colors.dark.textSecondary : colors.light.textSecondary,
                  marginTop: 2,
                  textAlign: 'center',
                }}
              >
                {label}
              </Text>
            )}
            {sublabel && (
              <Text
                style={{
                  fontSize: fontSize.xs,
                  color: isDark ? colors.dark.textTertiary : colors.light.textTertiary,
                  marginTop: 2,
                  textAlign: 'center',
                }}
              >
                {sublabel}
              </Text>
            )}
          </>
        )}
      </View>
    </View>
  );
}
