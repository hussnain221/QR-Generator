import mobileAds, {
  InterstitialAd,
  RewardedAd,
  AdEventType,
  RewardedAdEventType,
} from 'react-native-google-mobile-ads';
import { AdUnitIds } from './adUnitIds';

export class AdManager {
  private static instance: AdManager;
  private lastInterstitialShown: number = 0;
  private readonly minIntervalSeconds = 60;

  private interstitialAd: InterstitialAd | null = null;
  private isInterstitialLoaded: boolean = false;
  private isInterstitialLoading: boolean = false;

  private rewardedAd: RewardedAd | null = null;
  private isRewardedLoaded: boolean = false;
  private isRewardedLoading: boolean = false;

  private isInitialized: boolean = false;

  private constructor() {}

  public static getInstance(): AdManager {
    if (!AdManager.instance) {
      AdManager.instance = new AdManager();
    }
    return AdManager.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;
    try {
      await mobileAds().initialize();
      this.isInitialized = true;
      this.preloadInterstitial();
      this.preloadRewarded();
    } catch (err) {
      // Graceful offline degradation - ads simply will not serve
      console.warn('AdMob failed to initialize (offline or missing SDK):', err);
    }
  }

  // === INTERSTITIAL ADS ===

  public preloadInterstitial(): void {
    if (this.isInterstitialLoaded || this.isInterstitialLoading) return;

    try {
      this.isInterstitialLoading = true;
      const ad = InterstitialAd.createForAdRequest(AdUnitIds.interstitial, {
        requestNonPersonalizedAdsOnly: true,
      });

      ad.addAdEventListener(AdEventType.LOADED, () => {
        this.interstitialAd = ad;
        this.isInterstitialLoaded = true;
        this.isInterstitialLoading = false;
      });

      ad.addAdEventListener(AdEventType.ERROR, (error) => {
        this.isInterstitialLoaded = false;
        this.isInterstitialLoading = false;
        this.interstitialAd = null;
      });

      ad.addAdEventListener(AdEventType.CLOSED, () => {
        this.isInterstitialLoaded = false;
        this.interstitialAd = null;
        // Preload next interstitial after closing
        setTimeout(() => this.preloadInterstitial(), 1000);
      });

      ad.load();
    } catch {
      this.isInterstitialLoading = false;
    }
  }

  public canShowInterstitial(): boolean {
    const now = Date.now();
    return (
      this.isInterstitialLoaded &&
      this.interstitialAd !== null &&
      now - this.lastInterstitialShown > this.minIntervalSeconds * 1000
    );
  }

  public async showInterstitial(): Promise<boolean> {
    if (!this.canShowInterstitial() || !this.interstitialAd) {
      return false;
    }

    try {
      this.lastInterstitialShown = Date.now();
      await this.interstitialAd.show();
      return true;
    } catch {
      return false;
    }
  }

  // === REWARDED ADS ===

  public preloadRewarded(): void {
    if (this.isRewardedLoaded || this.isRewardedLoading) return;

    try {
      this.isRewardedLoading = true;
      const ad = RewardedAd.createForAdRequest(AdUnitIds.rewarded, {
        requestNonPersonalizedAdsOnly: true,
      });

      ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
        this.rewardedAd = ad;
        this.isRewardedLoaded = true;
        this.isRewardedLoading = false;
      });

      ad.addAdEventListener(AdEventType.ERROR, () => {
        this.isRewardedLoaded = false;
        this.isRewardedLoading = false;
        this.rewardedAd = null;
      });

      ad.addAdEventListener(AdEventType.CLOSED, () => {
        this.isRewardedLoaded = false;
        this.rewardedAd = null;
        setTimeout(() => this.preloadRewarded(), 1000);
      });

      ad.load();
    } catch {
      this.isRewardedLoading = false;
    }
  }

  public isRewardedReady(): boolean {
    return this.isRewardedLoaded && this.rewardedAd !== null;
  }

  public async waitForRewardedReady(timeoutMs: number = 4000): Promise<boolean> {
    if (this.isRewardedReady()) return true;
    this.preloadRewarded();

    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (this.isRewardedReady()) return true;
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    return this.isRewardedReady();
  }

  public async showRewardedAsync(): Promise<{
    earned: boolean;
    reason?: 'not_ready' | 'dismissed_early' | 'error';
  }> {
    const isReady = await this.waitForRewardedReady(4000);
    if (!isReady || !this.rewardedAd) {
      return { earned: false, reason: 'not_ready' };
    }

    const currentAd = this.rewardedAd;
    return new Promise((resolve) => {
      let didEarn = false;
      let hasResolved = false;

      const finish = (earned: boolean, reason?: 'not_ready' | 'dismissed_early' | 'error') => {
        if (hasResolved) return;
        hasResolved = true;
        resolve({ earned, reason });
      };

      const unsubReward = currentAd.addAdEventListener(
        RewardedAdEventType.EARNED_REWARD,
        () => {
          didEarn = true;
        }
      );

      const unsubClose = currentAd.addAdEventListener(
        AdEventType.CLOSED,
        () => {
          unsubReward();
          unsubClose();
          unsubError();
          finish(didEarn, didEarn ? undefined : 'dismissed_early');
        }
      );

      const unsubError = currentAd.addAdEventListener(
        AdEventType.ERROR,
        () => {
          unsubReward();
          unsubClose();
          unsubError();
          finish(false, 'error');
        }
      );

      currentAd.show().catch(() => {
        unsubReward();
        unsubClose();
        unsubError();
        finish(false, 'error');
      });
    });
  }

  public async showRewarded(onReward: () => void): Promise<boolean> {
    const res = await this.showRewardedAsync();
    if (res.earned) {
      onReward();
      return true;
    }
    return false;
  }
}
