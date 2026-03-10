import { Injectable } from '@nestjs/common';

export interface NormalizedChatInput {
  normalizedMessage: string;
  detectedLanguage: 'en' | 'hi' | 'hinglish';
}

@Injectable()
export class ChatbotLanguageIntentService {
  normalizeMessage(rawMessage: string): NormalizedChatInput {
    const message = (rawMessage || '').trim();
    const lower = message.toLowerCase();

    const detectedLanguage = this.detectLanguage(lower);
    const normalizedMessage = this.normalizeKeywords(lower);

    return { normalizedMessage, detectedLanguage };
  }

  private detectLanguage(message: string): 'en' | 'hi' | 'hinglish' {
    const hindiSignals = ['shaadi', 'vivah', 'mehndi', 'sangeet', 'budget kitna', 'shehar'];
    const englishSignals = ['wedding', 'budget', 'vendor', 'photographer', 'timeline'];
    const hasDevanagari = /[\u0900-\u097F]/.test(message);

    const hasHindi = hindiSignals.some((token) => message.includes(token));
    const hasEnglish = englishSignals.some((token) => message.includes(token));

    if ((hasHindi || hasDevanagari) && hasEnglish) {
      return 'hinglish';
    }

    if (hasHindi || hasDevanagari) {
      return 'hi';
    }

    return 'en';
  }

  private normalizeKeywords(message: string): string {
    const replacements: Record<string, string> = {
      shaadi: 'wedding',
      shadi: 'wedding',
      photographer: 'photography vendor',
      caterer: 'catering vendor',
      decorator: 'decor vendor',
      venue: 'venues',
      budget: 'budget',
      shehar: 'city',
      jagah: 'venue',
      khana: 'catering',
      mehendi: 'mehndi',
      bandbaja: 'music entertainment',
      kam: 'under',
      lakh: '100000',
      lac: '100000',
    };

    let normalized = ` ${message} `;

    Object.entries(replacements).forEach(([from, to]) => {
      const pattern = new RegExp(`\\b${from}\\b`, 'gi');
      normalized = normalized.replace(pattern, to);
    });

    return normalized.trim();
  }
}
