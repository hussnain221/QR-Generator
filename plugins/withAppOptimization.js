const {
  withGradleProperties,
  withAndroidManifest,
  withAndroidStyles,
  AndroidConfig,
} = require('@expo/config-plugins');

function withAppOptimization(config) {
  // 1. Enable R8/ProGuard code shrinking and resource shrinking for release builds
  config = withGradleProperties(config, (config) => {
    config.modResults = config.modResults.filter(
      (item) =>
        item.key !== 'android.enableMinifyInReleaseBuilds' &&
        item.key !== 'android.enableShrinkResourcesInReleaseBuilds'
    );
    config.modResults.push({
      type: 'property',
      key: 'android.enableMinifyInReleaseBuilds',
      value: 'true',
    });
    config.modResults.push({
      type: 'property',
      key: 'android.enableShrinkResourcesInReleaseBuilds',
      value: 'true',
    });
    return config;
  });

  // 2. Set android:resizeableActivity="true" for large screen devices
  config = withAndroidManifest(config, (config) => {
    const mainApplication = config.modResults.manifest.application?.[0];
    if (mainApplication) {
      mainApplication.$['android:resizeableActivity'] = 'true';
    }
    return config;
  });

  // 3. Remove deprecated statusBarColor & navigationBarColor to satisfy modern edge-to-edge
  config = withAndroidStyles(config, (config) => {
    config.modResults = AndroidConfig.Styles.removeStylesItem({
      xml: config.modResults,
      parent: AndroidConfig.Styles.getAppThemeGroup(),
      name: 'android:statusBarColor',
    });
    config.modResults = AndroidConfig.Styles.removeStylesItem({
      xml: config.modResults,
      parent: AndroidConfig.Styles.getAppThemeGroup(),
      name: 'android:navigationBarColor',
    });
    return config;
  });

  return config;
}

module.exports = withAppOptimization;
