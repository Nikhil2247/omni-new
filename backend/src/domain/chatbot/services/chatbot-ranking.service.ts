import { Injectable } from '@nestjs/common';
import { ChatbotVendorSuggestion } from '../types/chatbot.types';

@Injectable()
export class ChatbotRankingService {
  rankVendors(vendors: ChatbotVendorSuggestion[]): ChatbotVendorSuggestion[] {
    if (!vendors.length) {
      return vendors;
    }

    return [...vendors].sort((a, b) => this.scoreVendor(b) - this.scoreVendor(a));
  }

  private scoreVendor(vendor: ChatbotVendorSuggestion): number {
    // Weighted blend for v1: verified status + budget richness + known response speed signal.
    const verifiedBoost = vendor.isVerified ? 20 : 0;
    const budgetSignal = this.getBudgetSignal(vendor.minPrice, vendor.maxPrice);
    const responseSignal = this.getResponseSignal(vendor.responseTimeMinutes);

    return verifiedBoost + budgetSignal + responseSignal;
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
}
