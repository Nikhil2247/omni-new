import { Injectable } from '@nestjs/common';
import { DragonflyService } from '../../../infrastructure/cache/dragonfly.service';

interface DailyRawMetrics {
  totalInteractions?: number;
  vendorResultInteractions?: number;
  totalVendorsFound?: number;
  totalResponseTimeMs?: number;
  totalConfidence?: number;
  [key: string]: number | undefined;
}

@Injectable()
export class ChatbotAdminService {
  constructor(private readonly cache: DragonflyService) {}

  async getDailyMetrics(date?: string) {
    const dateKey = this.normalizeDateKey(date);
    const metricsKey = `chatbot:metrics:${dateKey}`;
    const raw = (await this.cache.get<DailyRawMetrics>(metricsKey)) || {};

    const totalInteractions = raw.totalInteractions || 0;
    const totalResponseTimeMs = raw.totalResponseTimeMs || 0;
    const totalConfidence = raw.totalConfidence || 0;

    const intentBreakdown = this.extractBreakdown(raw, 'intent:');
    const languageBreakdown = this.extractBreakdown(raw, 'language:');

    return {
      date: dateKey,
      totals: {
        totalInteractions,
        vendorResultInteractions: raw.vendorResultInteractions || 0,
        totalVendorsFound: raw.totalVendorsFound || 0,
        avgResponseTimeMs:
          totalInteractions > 0
            ? Math.round(totalResponseTimeMs / totalInteractions)
            : 0,
        avgConfidence:
          totalInteractions > 0
            ? Number((totalConfidence / totalInteractions).toFixed(3))
            : 0,
      },
      breakdown: {
        intents: intentBreakdown,
        languages: languageBreakdown,
      },
    };
  }

  async getSessionMetrics(sessionId: string) {
    const sessionKey = `chatbot:session-metrics:${sessionId}`;
    const session =
      (await this.cache.get<Record<string, string | number>>(sessionKey)) || {};

    return {
      sessionId,
      turns: Number(session.turns || 0),
      lastIntent: session.lastIntent || null,
      lastLanguage: session.lastLanguage || null,
      lastConfidence: Number(session.lastConfidence || 0),
      lastVendorsFound: Number(session.lastVendorsFound || 0),
      lastResponseTimeMs: Number(session.lastResponseTimeMs || 0),
      hasData: Object.keys(session).length > 0,
    };
  }

  private extractBreakdown(
    raw: DailyRawMetrics,
    prefix: string,
  ): Record<string, number> {
    const out: Record<string, number> = {};

    Object.entries(raw).forEach(([key, value]) => {
      if (!key.startsWith(prefix) || typeof value !== 'number') {
        return;
      }

      out[key.replace(prefix, '')] = value;
    });

    return out;
  }

  private normalizeDateKey(date?: string): string {
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }

    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}
