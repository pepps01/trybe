// Expo config plugin: let the app see installed web browsers on Android 11+.
//
// Sign-in opens Trybe Identity with expo-web-browser. Before opening, it asks
// Android which apps can handle an https link. Since Android 11 (package
// visibility), apps only see apps their manifest declares interest in.
// expo-web-browser only declares Custom Tabs *services*, so on phones whose
// browser isn't visible that way (e.g. Chrome disabled, another default
// browser) the lookup returns nothing → "No matching browser activity found".
//
// Declaring the standard "browse an https link" intent fixes that.
const { withAndroidManifest } = require('expo/config-plugins');

const BROWSER_QUERY = {
  action: [{ $: { 'android:name': 'android.intent.action.VIEW' } }],
  category: [{ $: { 'android:name': 'android.intent.category.BROWSABLE' } }],
  data: [{ $: { 'android:scheme': 'https' } }],
};

module.exports = function withBrowserQueries(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;
    manifest.queries = manifest.queries ?? [{}];
    const queries = manifest.queries[0];
    queries.intent = queries.intent ?? [];

    const already = queries.intent.some(
      (i) =>
        i.action?.some((a) => a.$['android:name'] === 'android.intent.action.VIEW') &&
        i.data?.some((d) => d.$['android:scheme'] === 'https'),
    );
    if (!already) queries.intent.push(BROWSER_QUERY);
    return cfg;
  });
};
