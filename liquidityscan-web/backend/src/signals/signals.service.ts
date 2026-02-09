import { Injectable } from '@nestjs/common';
import { SUPER_ENGULFING_TIMEFRAMES } from './dto/webhook-signal.dto';

const MAX_SIGNALS = 5000;
const ALLOWED_TF = new Set<string>(SUPER_ENGULFING_TIMEFRAMES);

export type WebhookSignalInput = {
  id?: string;
  strategyType: string;
  symbol: string;
  timeframe: string;
  signalType: string;
  price: number;
  detectedAt?: string;
  status?: string;
  metadata?: Record<string, unknown>;
};

export interface StoredSignal {
  id: string;
  strategyType: string;
  symbol: string;
  timeframe: string;
  signalType: string;
  price: number;
  detectedAt: string;
  status: string;
  metadata?: Record<string, unknown>;
}

/** Grno payload: body.signals is array of { symbol, price, signals_by_timeframe: { "1d": { signals: ["REV Bull"], price, time }, ... } } */
function transformGrnoPayloadToSignals(body: unknown): WebhookSignalInput[] {
  if (body == null || typeof body !== 'object' || !Array.isArray((body as any).signals)) {
    return [];
  }
  const grno = body as { signals: Array<{ symbol: string; price: number; signals_by_timeframe?: Record<string, { signals?: string[]; price?: number; time?: string }> }> };
  const nowIso = new Date().toISOString();
  const out: WebhookSignalInput[] = [];

  for (const item of grno.signals) {
    const symbol = String(item.symbol ?? '');
    const fallbackPrice = Number(item.price) || 0;
    const byTf = item.signals_by_timeframe && typeof item.signals_by_timeframe === 'object' ? item.signals_by_timeframe : {};

    for (const tf of Object.keys(byTf)) {
      const tfNorm = tf.toLowerCase();
      if (!ALLOWED_TF.has(tfNorm)) continue; // only 4h, 1d, 1w; ignore 1h, 5m, 15m, etc.
      const block = byTf[tf];
      const signalsList = Array.isArray(block?.signals) ? block.signals : [];
      const price = typeof block?.price === 'number' ? block.price : fallbackPrice;
      const detectedAt = typeof block?.time === 'string' ? block.time : nowIso;
      const firstSignal = signalsList[0];
      const signalType = typeof firstSignal === 'string' && firstSignal.toLowerCase().includes('bear') ? 'SELL' : 'BUY';
      out.push({
        strategyType: 'SUPER_ENGULFING',
        symbol,
        timeframe: tfNorm,
        signalType,
        price,
        detectedAt,
      });
    }
  }
  return out;
}

@Injectable()
export class SignalsService {
  private signals: StoredSignal[] = [];

  /**
   * Normalize webhook body:
   * - Grno batch: { signals: [ { symbol, price, signals_by_timeframe }, ... ] } -> transform;
   * - Grno single: { symbol, price, signals_by_timeframe } (one coin per request) -> wrap and transform;
   * - else array or generic object -> [body].
   */
  normalizeWebhookBody(body: unknown): WebhookSignalInput[] {
    if (body != null && typeof body === 'object') {
      const b = body as Record<string, unknown>;
      if (Array.isArray(b.signals)) {
        return transformGrnoPayloadToSignals(body);
      }
      // Single-coin format: one object with symbol + signals_by_timeframe (no top-level "signals" array)
      if (typeof b.symbol === 'string' && b.signals_by_timeframe != null && typeof b.signals_by_timeframe === 'object') {
        return transformGrnoPayloadToSignals({ signals: [body] });
      }
    }
    if (Array.isArray(body)) return (body as WebhookSignalInput[]);
    if (body != null && typeof body === 'object') return [body as WebhookSignalInput];
    return [];
  }

  /**
   * Add signals. Only SUPER_ENGULFING with timeframe 4h|1d|1w are accepted.
   * Others are filtered out. Generate id if missing. Keep at most MAX_SIGNALS (newest).
   */
  addSignals(items: Array<{ id?: string; strategyType: string; symbol: string; timeframe: string; signalType: string; price: number; detectedAt?: string; status?: string; metadata?: Record<string, unknown> }>): number {
    const allowedTf = new Set(SUPER_ENGULFING_TIMEFRAMES);
    const nowIso = new Date().toISOString();
    const toAdd: StoredSignal[] = [];

    for (const s of items) {
      if (s.strategyType !== 'SUPER_ENGULFING' || !allowedTf.has(s.timeframe as any)) continue;
      const id = s.id?.trim() || `${s.symbol}-${s.timeframe}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      toAdd.push({
        id,
        strategyType: 'SUPER_ENGULFING',
        symbol: String(s.symbol),
        timeframe: s.timeframe,
        signalType: s.signalType,
        price: Number(s.price),
        detectedAt: s.detectedAt && typeof s.detectedAt === 'string' ? s.detectedAt : nowIso,
        status: s.status && ['ACTIVE', 'EXPIRED', 'FILLED', 'CLOSED'].includes(s.status) ? s.status : 'ACTIVE',
        metadata: s.metadata && typeof s.metadata === 'object' ? s.metadata : undefined,
      });
    }

    const byId = new Map(this.signals.map((x) => [x.id, x]));
    for (const s of toAdd) {
      byId.set(s.id, s);
    }
    this.signals = Array.from(byId.values());
    if (this.signals.length > MAX_SIGNALS) {
      this.signals = this.signals.slice(-MAX_SIGNALS);
    }
    return toAdd.length;
  }

  /**
   * Get stored signals. Currently only Super Engulfing is stored; strategyType filter is optional.
   */
  getSignals(strategyType?: string): StoredSignal[] {
    let list = this.signals;
    if (strategyType) {
      list = list.filter((s) => s.strategyType === strategyType);
    }
    return [...list];
  }
}
