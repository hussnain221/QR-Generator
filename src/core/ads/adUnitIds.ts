import { TestIds } from 'react-native-google-mobile-ads';

export const AdUnitIds = {
  banner: __DEV__ ? TestIds.BANNER : 'ca-app-pub-5295952118007438/9317873738',
  interstitial: __DEV__ ? TestIds.INTERSTITIAL : 'ca-app-pub-5295952118007438/4616122107',
  rewarded: __DEV__ ? TestIds.REWARDED : 'ca-app-pub-5295952118007438/5509481505',
};
