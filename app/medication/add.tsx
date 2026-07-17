import { View, Text, ScrollView, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMedicationStore } from '@/stores/useMedicationStore';
import { useIsDark } from '@/stores/useSettingsStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { colors, borderRadius, spacing, fontSize, fontWeight, medicationColors } from '@/lib/theme';
import { generateId } from '@/lib/utils';
import { useState } from 'react';
import { DosageUnit, ReminderType, ReminderTime } from '@/types';
import { useTranslation } from '@/i18n';
import { useInterstitial } from '@/components/InterstitialAdManager';
const units: DosageUnit[] = ['mg', 'ml', 'tablets', 'capsules'];

export default function AddMedicationScreen() {
  const { showInterstitial } = useInterstitial();
  const { t } = useTranslation();
  const schema = z.object({
    name: z.string().min(1, t('medAdd.validName')),
    dosage: z.string().regex(/^\d+(\.\d+)?$/, t('medAdd.validDosage')),
    notes: z.string().optional(),
    startDate: z.string().min(1, t('medAdd.validStart')),
    endDate: z.string().min(1, t('medAdd.validEnd')),
  });
  type FormData = z.infer<typeof schema>;
  const reminderTypes: { label: string; value: ReminderType }[] = [
    { label: t('medAdd.once'), value: 'once' },
    { label: t('medAdd.multiple'), value: 'multiple' },
    { label: t('medAdd.everyX'), value: 'interval' },
    { label: t('medAdd.weekdays'), value: 'weekdays' },
  ];
  const { addMedication } = useMedicationStore();
  const isDark = useIsDark();
  const [selectedUnit, setSelectedUnit] = useState<DosageUnit>('mg');
  const [selectedColor, setSelectedColor] = useState<string>(medicationColors[0]);
  const [reminderType, setReminderType] = useState<ReminderType>('once');
  const [reminderTimes, setReminderTimes] = useState<ReminderTime[]>([
    { id: generateId(), time: '08:00' },
  ]);
  const [intervalHours, setIntervalHours] = useState('8');
  const [weekdays, setWeekdays] = useState<number[]>([1, 2, 3, 4, 5]);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      dosage: '',
      notes: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().split('T')[0],
    },
  });

  const formatTimeInput = (text: string): string => {
    const digits = text.replace(/\D/g, '').slice(0, 4);
    if (digits.length === 0) return '';
    if (digits.length <= 2) return digits;
    return digits.slice(0, 2) + ':' + digits.slice(2);
  };

  const addReminderTime = () => {
    setReminderTimes([...reminderTimes, { id: generateId(), time: '12:00' }]);
  };

  const updateReminderTime = (id: string, time: string) => {
    const formatted = formatTimeInput(time);
    setReminderTimes(reminderTimes.map((rt) => rt.id === id ? { ...rt, time: formatted } : rt));
  };

  const removeReminderTime = (id: string) => {
    if (reminderTimes.length > 1) {
      setReminderTimes(reminderTimes.filter((rt) => rt.id !== id));
    }
  };

  const toggleWeekday = (day: number) => {
    setWeekdays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const onSubmit = async (data: FormData) => {
    let times: ReminderTime[] = [];

    switch (reminderType) {
      case 'once':
        times = reminderTimes.slice(0, 1);
        break;
      case 'multiple':
        times = reminderTimes;
        break;
      case 'interval':
        const startHour = 8;
        const endHour = 22;
        const intervalH = parseInt(intervalHours) || 8;
        times = [];
        for (let h = startHour; h < endHour; h += intervalH) {
          const time = `${h.toString().padStart(2, '0')}:00`;
          times.push({ id: generateId(), time });
        }
        break;
      case 'weekdays':
        times = reminderTimes.map((rt) => ({
          ...rt,
          days: weekdays,
        }));
        break;
    }

    try {
      await addMedication({
        name: data.name,
        dosage: parseFloat(data.dosage),
        unit: selectedUnit,
        notes: data.notes || '',
        startDate: data.startDate,
        endDate: data.endDate,
        color: selectedColor,
        reminderType,
        reminderTimes: times,
        intervalHours: reminderType === 'interval' ? parseFloat(intervalHours) : undefined,
      });
      showInterstitial();
      router.back();
    } catch {
      Alert.alert(t('common.error'), t('medAdd.saveError'));
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={[
          styles.container,
          { backgroundColor: isDark ? colors.dark.background : colors.light.background },
        ]}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: colors.light.primary, fontSize: fontSize.md, fontWeight: fontWeight.semibold }}>
              {t('common.cancel')}
            </Text>
          </TouchableOpacity>
          <Text
            style={{
              fontSize: fontSize.md,
              fontWeight: fontWeight.bold,
              color: isDark ? colors.dark.text : colors.light.text,
              marginLeft: spacing.sm,
            }}
          >
            {t('medAdd.title')}
          </Text>
          <View style={{ width: 50 }} />
        </View>

        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, value } }) => (
            <Input label={t('medAdd.name')} placeholder={t('medAdd.namePlaceholder')} value={value} onChangeText={onChange} error={errors.name?.message} />
          )}
        />

        {/* Campo de Dosagem */}
        <Controller
          control={control}
          name="dosage"
          render={({ field: { onChange, value } }) => (
            <Input
              label={selectedUnit === 'mg' || selectedUnit === 'ml' ? t('medAdd.dosage') : t('medAdd.quantity')}
              placeholder={selectedUnit === 'mg' || selectedUnit === 'ml' ? t('medAdd.dosagePlaceholder') : t('medAdd.quantityPlaceholder')}
              keyboardType="decimal-pad"
              value={value}
              onChangeText={onChange}
              error={errors.dosage?.message}
            />
          )}
        />

        {/* Chips de unidade — linha única compacta */}
        <Text style={[styles.label, { color: isDark ? colors.dark.textSecondary : colors.light.textSecondary }]}>
          {t('medAdd.unit')}
        </Text>
        <View style={styles.unitRow}>
          {units.map((unit) => (
            <TouchableOpacity
              key={unit}
              onPress={() => setSelectedUnit(unit)}
              style={[
                styles.unitChip,
                {
                  backgroundColor: selectedUnit === unit
                    ? colors.light.primary
                    : (isDark ? colors.dark.surfaceSecondary : colors.light.surfaceSecondary),
                },
              ]}
            >
              <Text
                style={{
                  color: selectedUnit === unit ? '#FFFFFF' : (isDark ? colors.dark.textSecondary : colors.light.textSecondary),
                  fontSize: 11,
                  fontWeight: selectedUnit === unit ? fontWeight.semibold : fontWeight.medium,
                  letterSpacing: 0.2,
                }}
                numberOfLines={1}
              >
                {t('medAdd.' + unit)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.label, { color: isDark ? colors.dark.textSecondary : colors.light.textSecondary }]}>{t('medAdd.colorTag')}</Text>
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md }}>
          {medicationColors.map((color) => (
            <TouchableOpacity
              key={color}
              onPress={() => setSelectedColor(color)}
              style={[
                styles.colorDot,
                { backgroundColor: color },
                selectedColor === color && styles.colorDotSelected,
              ]}
            />
          ))}
        </View>

        <Controller
          control={control}
          name="notes"
          render={({ field: { onChange, value } }) => (
            <Input label={t('medAdd.notes')} placeholder={t('medAdd.notesPlaceholder')} value={value} onChangeText={onChange} multiline numberOfLines={3} />
          )}
        />

        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <View style={{ flex: 1 }}>
            <Controller
              control={control}
              name="startDate"
              render={({ field: { onChange, value } }) => (
                <Input label={t('medAdd.startDate')} placeholder={t('medAdd.startPlaceholder')} value={value} onChangeText={onChange} error={errors.startDate?.message} />
              )}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Controller
              control={control}
              name="endDate"
              render={({ field: { onChange, value } }) => (
                <Input label={t('medAdd.endDate')} placeholder={t('medAdd.endPlaceholder')} value={value} onChangeText={onChange} error={errors.endDate?.message} />
              )}
            />
          </View>
        </View>

        <Text style={[styles.label, { color: isDark ? colors.dark.textSecondary : colors.light.textSecondary }]}>{t('medAdd.schedule')}</Text>
        {reminderTypes.map((type) => (
          <TouchableOpacity
            key={type.value}
            onPress={() => setReminderType(type.value)}
            style={[
              styles.reminderTypeRow,
              {
                backgroundColor: reminderType === type.value ? colors.light.primary : (isDark ? colors.dark.surfaceSecondary : colors.light.surfaceSecondary),
                borderColor: reminderType === type.value ? colors.light.primary : (isDark ? colors.dark.border : colors.light.border),
              },
            ]}
          >
            <Text
              style={{
                color: reminderType === type.value ? '#FFFFFF' : (isDark ? colors.dark.text : colors.light.text),
                fontWeight: fontWeight.medium,
              }}
            >
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}

        <Card style={{ marginTop: spacing.md }}>
          <Text style={{ fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: isDark ? colors.dark.text : colors.light.text, marginBottom: spacing.sm }}>
            {t('medAdd.reminderTimes')}
          </Text>
          {reminderTimes.map((rt) => (
            <View key={rt.id} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }}>
              <Input
                placeholder={t('medAdd.timePlaceholder')}
                value={rt.time}
                onChangeText={(t) => updateReminderTime(rt.id, t)}
                keyboardType="numeric"
                containerStyle={{ flex: 1, marginBottom: 0 }}
                style={{ textAlign: 'center' }}
              />
              {reminderTimes.length > 1 && (
                <TouchableOpacity onPress={() => removeReminderTime(rt.id)}>
                  <Text style={{ color: colors.light.danger, fontSize: fontSize.lg }}>×</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
          {(reminderType === 'once' || reminderType === 'multiple') && (
            <Button title={t('medAdd.addTime')} variant="ghost" onPress={addReminderTime} />
          )}
        </Card>

        {reminderType === 'interval' && (
          <Input label={t('medAdd.everyXHours')} placeholder={t('medAdd.everyXPlaceholder')} keyboardType="numeric" value={intervalHours} onChangeText={setIntervalHours} />
        )}

        {reminderType === 'weekdays' && (
          <Card>
            <Text style={{ fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: isDark ? colors.dark.text : colors.light.text, marginBottom: spacing.sm }}>
              {t('medAdd.selectDays')}
            </Text>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              {[t('medAdd.mon'), t('medAdd.tue'), t('medAdd.wed'), t('medAdd.thu'), t('medAdd.fri'), t('medAdd.sat'), t('medAdd.sun')].map((day, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => toggleWeekday(i + 1)}
                  style={[
                    styles.weekdayChip,
                    {
                      backgroundColor: weekdays.includes(i + 1) ? colors.light.primary : (isDark ? colors.dark.surfaceSecondary : colors.light.surfaceSecondary),
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: weekdays.includes(i + 1) ? '#FFFFFF' : (isDark ? colors.dark.text : colors.light.text),
                      fontSize: fontSize.sm,
                      fontWeight: fontWeight.semibold,
                    }}
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>
        )}

        <Button title={t('medAdd.save')} onPress={handleSubmit(onSubmit)} size="lg" style={{ marginTop: spacing.lg }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.xs },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.xs,
  },
  dosageUnitBlock: {
    marginBottom: spacing.xs,
  },
  dosageUnitLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  dosageLabelText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  dosageUnitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  dosageInput: {
    flex: 1,
    marginBottom: 0,
  },
  unitRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  unitChip: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: spacing.xs,
    borderRadius: borderRadius.full ?? 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  colorDotSelected: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  reminderTypeRow: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  weekdayChip: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
