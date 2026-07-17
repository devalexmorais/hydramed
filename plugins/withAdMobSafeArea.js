/**
 * Expo Config Plugin: withAdMobSafeArea
 *
 * Fixes the Google Ads "Skip Ad" / "Close" button being hidden behind the
 * Android status bar / notification area on Android 15+ (edge-to-edge enforcement).
 *
 * What this plugin does:
 *  1. Adds a custom theme "AdActivityTheme" to res/values/styles.xml that opts
 *     out of the Android 15 edge-to-edge enforcement and sets fitsSystemWindows.
 *  2. Registers that theme on the com.google.android.gms.ads.AdActivity entry
 *     in AndroidManifest.xml so every ad overlay respects the system insets.
 */

const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
const { resolve } = require('path');
const fs = require('fs');

// ---------------------------------------------------------------------------
// 1. Inject the custom theme into res/values/styles.xml
// ---------------------------------------------------------------------------
const withAdMobStylesFix = (config) =>
  withDangerousMod(config, [
    'android',
    async (config) => {
      const stylesPath = resolve(
        config.modRequest.platformProjectRoot,
        'app/src/main/res/values/styles.xml'
      );

      let stylesContent = fs.existsSync(stylesPath)
        ? fs.readFileSync(stylesPath, 'utf8')
        : `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n</resources>`;

      // Only add the theme if it hasn't been added yet
      if (!stylesContent.includes('AdActivityTheme')) {
        const theme = `
    <!-- Fix: Prevent the "Skip Ad" button from being hidden behind the
         Android status bar / notification area (Android 15+ edge-to-edge) -->
    <style name="AdActivityTheme" parent="@android:style/Theme.Translucent.NoTitleBar">
        <item name="android:windowOptOutEdgeToEdgeEnforcement" tools:targetApi="35">true</item>
        <item name="android:fitsSystemWindows">true</item>
    </style>
`;
        stylesContent = stylesContent.replace('</resources>', `${theme}</resources>`);

        // Ensure the tools namespace is declared on <resources>
        if (!stylesContent.includes('xmlns:tools')) {
          stylesContent = stylesContent.replace(
            '<resources>',
            '<resources xmlns:tools="http://schemas.android.com/tools">'
          );
        }

        fs.writeFileSync(stylesPath, stylesContent, 'utf8');
      }

      return config;
    },
  ]);

// ---------------------------------------------------------------------------
// 2. Apply the theme to AdActivity in AndroidManifest.xml
// ---------------------------------------------------------------------------
const withAdMobManifestFix = (config) =>
  withAndroidManifest(config, (config) => {
    const manifest = config.modResults;
    const application = manifest.manifest.application?.[0];

    if (!application) return config;

    if (!application.activity) {
      application.activity = [];
    }

    // Check if AdActivity entry already exists
    const adActivityIndex = application.activity.findIndex(
      (a) => a.$?.['android:name'] === 'com.google.android.gms.ads.AdActivity'
    );

    const adActivityEntry = {
      $: {
        'android:name': 'com.google.android.gms.ads.AdActivity',
        'android:configChanges':
          'keyboard|keyboardHidden|orientation|screenLayout|uiMode|screenSize|smallestScreenSize',
        'android:theme': '@style/AdActivityTheme',
        'tools:replace': 'android:theme',
        'tools:ignore': 'MissingClass',
      },
    };

    if (adActivityIndex >= 0) {
      // Update existing entry with our theme
      application.activity[adActivityIndex] = {
        ...application.activity[adActivityIndex],
        $: {
          ...application.activity[adActivityIndex].$,
          'android:theme': '@style/AdActivityTheme',
          'tools:replace': 'android:theme',
          'tools:ignore': 'MissingClass',
        },
      };
    } else {
      application.activity.push(adActivityEntry);
    }

    // Ensure tools namespace is declared on <manifest>
    if (!manifest.manifest.$['xmlns:tools']) {
      manifest.manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
    }

    return config;
  });

// ---------------------------------------------------------------------------
// Compose both modifications into a single plugin
// ---------------------------------------------------------------------------
const withAdMobSafeArea = (config) => {
  config = withAdMobStylesFix(config);
  config = withAdMobManifestFix(config);
  return config;
};

module.exports = withAdMobSafeArea;
