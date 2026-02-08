import { getApiBaseUrl } from './userApi';
import { Signal, StrategyType } from '../types';

/**
 * Fetch signals from backend GET /api/signals.
 * Currently only Super Engulfing is stored via webhook; other strategies return [].
 */
export async function fetchSignals(strategyType?: StrategyType, limit = 1000): Promise<Signal[]> {
  try {
    const baseUrl = getApiBaseUrl();
    const params = new URLSearchParams();
    if (strategyType) params.set('strategyType', strategyType);
    const url = `${baseUrl}/signals${params.toString() ? `?${params.toString()}` : ''}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    const list = Array.isArray(data) ? data : [];
    return (list as Signal[]).slice(0, limit);
  } catch {
    return [];
  }
}
