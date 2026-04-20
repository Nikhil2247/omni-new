import { Injectable } from '@nestjs/common';
import { ChatbotVendorSuggestion } from '../types/chatbot.types';

@Injectable()
export class ChatbotRankingService {
  rankVendors(vendors: ChatbotVendorSuggestion[]): ChatbotVendorSuggestion[] {
    if (!vendors.length) {
      return vendors;
    }

    return [...vendors]
      .map((vendor) => {
        const recommendationScore = Math.min(100, Math.round(this.scoreVendor(vendor)));
        return {
          ...vendor,
          recommendationScore,
          recommendationLabel: this.getRecommendationLabel(recommendationScore),
        };
      })
      .sort((a, b) => (b.recommendationScore ?? 0) - (a.recommendationScore ?? 0));
  }

  private scoreVendor(vendor: ChatbotVendorSuggestion): number {
    const planSignal = this.getPlanSignal(vendor.planTier);
    const aiRecommendationSignal = this.getAiRecommendationSignal(vendor.planTier);
    const verifiedBoost = vendor.isVerified ? 15 : 0;
    const badgeSignal = this.getBadgeSignal(vendor.hasProBadge, vendor.hasPremiumBadge);
    const profileBoostSignal = vendor.isProfileBoosted ? 6 : 0;
    const searchBoostSignal = this.getSearchBoostSignal(vendor.searchBoost);
    const budgetSignal = this.getBudgetSignal(vendor.minPrice, vendor.maxPrice);
    const responseSignal = this.getResponseSignal(vendor.responseTimeMinutes);

    return (
      planSignal +
      aiRecommendationSignal +
      verifiedBoost +
      badgeSignal +
      profileBoostSignal +
      searchBoostSignal +
      budgetSignal +
      responseSignal
    );
  }

  private getPlanSignal(planTier?: string): number {
    if (!planTier) {
      return 8;
    }

    const normalizedTier = planTier.toUpperCase();
    if (normalizedTier === 'ENTERPRISE') {
      return 22;
    }

    if (normalizedTier === 'PREMIUM' || normalizedTier === 'ELITE') {
      return 18;
    }

    if (normalizedTier === 'PRO' || normalizedTier === 'PLUS') {
      return 14;
    }

    return 10;
  }

  private getAiRecommendationSignal(planTier?: string): number {
    if (!planTier) {
      return 0;
    }

    const normalizedTier = planTier.toUpperCase();
    const aiRecommendedPlans = new Set(['PRO', 'PLUS', 'PREMIUM', 'ELITE', 'ENTERPRISE']);
    return aiRecommendedPlans.has(normalizedTier) ? 15 : 4;
  }

  private getBadgeSignal(hasProBadge?: boolean, hasPremiumBadge?: boolean): number {
    if (hasPremiumBadge) {
      return 10;
    }

    if (hasProBadge) {
      return 6;
    }

    return 0;
  }

  private getSearchBoostSignal(searchBoost?: number): number {
    if (typeof searchBoost !== 'number' || !Number.isFinite(searchBoost)) {
      return 0;
    }

    // Capped boost so ranking remains balanced with quality signals.
    return Math.min(12, Math.max(0, Math.round(searchBoost * 6)));
  }

  private getBudgetSignal(minPrice?: number, maxPrice?: number): number {
    if (typeof minPrice === 'number' && typeof maxPrice === 'number') {
      return 12;
    }

    if (typeof minPrice === 'number' || typeof maxPrice === 'number') {
      return 8;
    }

    return 0;
  }

  private getResponseSignal(responseTimeMinutes?: number): number {
    if (!responseTimeMinutes || responseTimeMinutes <= 0) {
      return 0;
    }

    if (responseTimeMinutes <= 30) {
      return 12;
    }

    if (responseTimeMinutes <= 120) {
      return 8;
    }

    return 4;
  }

  private getRecommendationLabel(score: number): 'high' | 'medium' | 'low' {
    if (score >= 75) {
      return 'high';
    }

    if (score >= 50) {
      return 'medium';
    }

    return 'low';
  }
}
