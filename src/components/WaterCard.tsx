import { View, Text, TouchableOpacity } from 'react-native';
import { Card } from '@/components/ui/Card';
import { colors, borderRadius, spacing, fontSize, fontWeight } from '@/lib/theme';
import { useIsDark } from '@/stores/useSettingsStore';
import { useTranslation } from '@/i18n';

interface WaterCardProps {
  currentIntake: number;
  goal: number;
  onAddWater: (amount: number) => void;
  onCustomAmount: () => void;
}

const quickAmounts = [100, 250, 500, 1000];

export function WaterCard({ currentIntake, goal, onAddWater, onCustomAmount }: WaterCardProps) {
  const { t } = useTranslation();
  const isDark = useIsDark();
  const progress = Math.min(currentIntake / goal, 1);

  return (
    <Card variant="elevated">
      <View style={{ gap: spacing.md }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text
            style={{
              fontSize: fontSize.lg,
              fontWeight: fontWeight.semibold,
              color: isDark ? colors.dark.text : colors.light.text,
            }}
          >
            💧 {t('water.title')}
          </Text>
          <View style={{ alignItems: 'flex-end' }}>
            <Text
              style={{
                fontSize: fontSize.xl,
                fontWeight: fontWeight.bold,
                color: colors.light.secondary,
              }}
            >
              {currentIntake}ml
            </Text>
            <Text
              style={{
                fontSize: fontSize.xs,
                color: isDark ? colors.dark.textTertiary : colors.light.textTertiary,
              }}
            >
              {t('water.goalLabel', { goal })}
            </Text>
          </View>
        </View>

        <View
          style={{
            height: 10,
            backgroundColor: isDark ? colors.dark.surfaceSecondary : colors.light.surfaceSecondary,
            borderRadius: borderRadius.full,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              width: `${progress * 100}%`,
              height: '100%',
              backgroundColor: colors.light.secondary,
              borderRadius: borderRadius.full,
            }}
          />
        </View>

        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {quickAmounts.map((amount) => (
            <TouchableOpacity
              key={amount}
              onPress={() => onAddWater(amount)}
              style={{
                flex: 1,
                backgroundColor: isDark ? colors.dark.surfaceSecondary : colors.light.surfaceSecondary,
                borderRadius: borderRadius.md,
                paddingVertical: spacing.sm,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: fontSize.sm,
                  fontWeight: fontWeight.semibold,
                  color: isDark ? colors.dark.text : colors.light.text,
                }}
              >
                +{amount}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          onPress={onCustomAmount}
          style={{
            backgroundColor: isDark ? colors.dark.surfaceSecondary : colors.light.surfaceSecondary,
            borderRadius: borderRadius.md,
            paddingVertical: spacing.sm,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: isDark ? colors.dark.border : colors.light.border,
            borderStyle: 'dashed',
          }}
        >
          <Text
            style={{
              fontSize: fontSize.sm,
              color: isDark ? colors.dark.textSecondary : colors.light.textSecondary,
            }}
          >
            {t('water.custom')}
          </Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
}
