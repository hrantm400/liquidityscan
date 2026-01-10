import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { signalsApi } from '../services/api';
import { wsService } from '../services/websocket';
import { Signal, StrategyType } from '../types';

interface UseMarketDataOptions {
  strategyType: StrategyType;
  timeframe?: string;
  limit?: number;
  refetchInterval?: number;
}

export const useMarketData = (options: UseMarketDataOptions) => {
  const { strategyType, timeframe, limit = 1000, refetchInterval = 30000 } = options;
  const [signals, setSignals] = useState<Signal[]>([]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['signals', strategyType, timeframe],
    queryFn: () =>
      signalsApi.getSignals({
        strategyType,
        timeframe: timeframe === 'all' ? undefined : (timeframe as any),
        limit,
      }),
    refetchInterval,
  });

  useEffect(() => {
    if (data) {
      const signalsArray = Array.isArray(data) ? data : [];
      setSignals(signalsArray as Signal[]);
    } else if (data === null || (Array.isArray(data) && data.length === 0)) {
      setSignals([]);
    }
  }, [data]);

  useEffect(() => {
    if (error) {
      console.error(`Error fetching ${strategyType} signals:`, error);
    }
  }, [error, strategyType]);

  useEffect(() => {
    wsService.subscribeToStrategy(strategyType);

    const handleNewSignal = (signal: Signal) => {
      if (signal.strategyType === strategyType) {
        setSignals((prev) => [signal, ...prev]);
      }
    };

    wsService.on('signal:new', handleNewSignal);

    return () => {
      wsService.off('signal:new', handleNewSignal);
    };
  }, [strategyType]);

  return {
    signals,
    isLoading,
    error,
    refetch,
  };
};
