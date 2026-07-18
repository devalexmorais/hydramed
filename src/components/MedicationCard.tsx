import { View, Text, TouchableOpacity } from 'react-native';
import { Medication, MedicationLog } from '@/types';
import { Card } from '@/components/ui/Card';
import { colors, borderRadius, spacing, fontSize, fontWeight } from '@/lib/theme';
import { useIsDark } from '@/stores/useSettingsStore';
import { formatTime } from '@/lib/utils';
import { useTranslation, translateUnit } from '@/i18n';

interface MedicationCardProps {
  medication: Medication;
  todayLog?: MedicationLog;
  onPress: () => void;
  onTake: () => void;
  onSkip: () => void;
  onSnooze: () => void;
}

export function MedicationCard({
  medication,
  todayLog,
  onPress,
  onTake,
  onSkip,
  onSnooze,
}: MedicationCardProps) {
  const { t, locale } = useTranslation();
  const isDark = useIsDark();
  const isTaken = todayLog?.status === 'taken';
  const isSkipped = todayLog?.status === 'skipped';

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card
        variant="elevated"
        style={{
          borderLeftWidth: 4,
          borderLeftColor: medication.color,
          opacity: isSkipped ? 0.6 : 1,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: borderRadius.md,
              backgroundColor: medication.color + '20',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 20 }}>💊</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: fontSize.md,
                fontWeight: fontWeight.semibold,
                color: isDark ? colors.dark.text : colors.light.text,
              }}
            >
              {medication.name}
            </Text>
            <Text
              style={{
                fontSize: fontSize.sm,
                color: isDark ? colors.dark.textSecondary : colors.light.textSecondary,
                marginTop: 2,
              }}
            >
              {medication.dosage} {translateUnit(medication.unit, locale)}
              {medication.reminderTimes.length > 0 &&
                ` · ${formatTime(medication.reminderTimes[0].time)}`}
            </Text>
          </View>
          {isTaken ? (
            <View
              style={{
                backgroundColor: colors.light.success + '20',
                paddingHorizontal: spacing.sm,
                paddingVertical: spacing.xs,
                borderRadius: borderRadius.sm,
              }}
            >
              <Text style={{ color: colors.light.success, fontSize: fontSize.xs, fontWeight: fontWeight.semibold }}>
                {t('common.taken')}
              </Text>
            </View>
          ) : isSkipped ? (
            <View
              style={{
                backgroundColor: colors.light.warning + '20',
                paddingHorizontal: spacing.sm,
                paddingVertical: spacing.xs,
                borderRadius: borderRadius.sm,
              }}
            >
              <Text style={{ color: colors.light.warning, fontSize: fontSize.xs, fontWeight: fontWeight.semibold }}>
                {t('common.skipped')}
              </Text>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', gap: spacing.xs }}>
              <TouchableOpacity
                onPress={onTake}
                style={{
                  backgroundColor: colors.light.success,
                  paddingHorizontal: spacing.sm,
                  paddingVertical: spacing.xs,
                  borderRadius: borderRadius.sm,
                }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: fontSize.xs, fontWeight: fontWeight.semibold }}>
                  {t('common.take')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onSkip}
                style={{
                  backgroundColor: isDark ? colors.dark.surfaceSecondary : colors.light.surfaceSecondary,
                  paddingHorizontal: spacing.sm,
                  paddingVertical: spacing.xs,
                  borderRadius: borderRadius.sm,
                }}
              >
                <Text style={{ color: isDark ? colors.dark.textSecondary : colors.light.textSecondary, fontSize: fontSize.xs }}>
                  {t('common.skip')}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );
}
