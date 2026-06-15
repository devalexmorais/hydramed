import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { colors, borderRadius, spacing, fontSize, fontWeight } from '@/lib/theme';
import { useIsDark } from '@/stores/useSettingsStore';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { useTranslation } from '@/i18n';

const { width } = Dimensions.get('window');

export default function WelcomeScreen() {
  const isDark = useIsDark();
  const { t } = useTranslation();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? colors.dark.background : colors.light.background },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Svg width={120} height={120} viewBox="0 0 120 120">
            <Circle cx={60} cy={60} r={55} fill={colors.light.primaryLight} />
            <Path
              d="M35 60 Q45 35 60 40 Q75 35 85 60 Q75 85 60 80 Q45 85 35 60Z"
              fill={colors.light.primary}
            />
            <Rect x={54} y={30} width={12} height={28} rx={6} fill="#FFFFFF" />
            <Rect x={54} y={62} width={12} height={28} rx={6} fill="#FFFFFF" />
            <Rect x={30} y={54} width={28} height={12} rx={6} fill="#FFFFFF" />
            <Rect x={62} y={54} width={28} height={12} rx={6} fill="#FFFFFF" />
          </Svg>
        </View>

        <Text
          style={[
            styles.title,
            { color: isDark ? colors.dark.text : colors.light.text },
          ]}
        >
          {t('onboard.welcome')}
        </Text>
        <Text
          style={[
            styles.subtitle,
            { color: isDark ? colors.dark.textSecondary : colors.light.textSecondary },
          ]}
        >
          {t('onboard.welcomeDesc')}
        </Text>

        <View style={styles.features}>
          {[
            { icon: '💊', title: t('onboard.medReminders'), desc: t('onboard.medRemindersDesc') },
            { icon: '💧', title: t('onboard.waterTracking'), desc: t('onboard.waterTrackingDesc') },
            { icon: '📊', title: t('onboard.healthAnalytics'), desc: t('onboard.healthAnalyticsDesc') },
          ].map((feature, i) => (
            <View key={i} style={styles.featureRow}>
              <Text style={styles.featureIcon}>{feature.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.featureTitle,
                    { color: isDark ? colors.dark.text : colors.light.text },
                  ]}
                >
                  {feature.title}
                </Text>
                <Text
                  style={[
                    styles.featureDesc,
                    { color: isDark ? colors.dark.textSecondary : colors.light.textSecondary },
                  ]}
                >
                  {feature.desc}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <Button
          title={t('onboard.getStarted')}
          onPress={() => router.push('/(onboarding)/permissions')}
          size="lg"
          style={{ width: '100%' }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
  },
  iconContainer: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontSize.md,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.md,
  },
  features: {
    width: '100%',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  featureIcon: {
    fontSize: 28,
  },
  featureTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  featureDesc: {
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  footer: {
    paddingBottom: spacing.xxl,
    paddingTop: spacing.md,
  },
});
