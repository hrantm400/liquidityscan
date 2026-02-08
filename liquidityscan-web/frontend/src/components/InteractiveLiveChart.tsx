import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { createChart, ColorType, Time } from 'lightweight-charts';
// import { wsService } from '../services/websocket'; // TODO: Re-enable when WebSocket service is recreated
import { useTheme } from '../contexts/ThemeContext';
import { TradingViewWidget } from './TradingViewWidget';
// import { api } from '../services/api'; // TODO: Re-enable when API service is recreated

// Type definitions for lightweight-charts
type IChartApi = ReturnType<typeof createChart>;
type ISeriesApi<T> = any; // Simplified type for series

interface Candle {
  id?: string;
  symbol: string;
  timeframe: string;
  openTime: Date | string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  quoteVolume?: number | null;
}

interface Signal {
  id: string;
  symbol: string;
  timeframe: string;
  signalType: 'BUY' | 'SELL';
  detectedAt: Date | string;
  price: number | string;
  metadata?: Record<string, unknown>;
}

interface InteractiveLiveChartProps {
  candles: Candle[];
  signal?: Signal;
  symbol: string;
  timeframe: string;
  height?: number;
  isFullscreen?: boolean;
  onCandleUpdate?: (candle: Candle) => void;
}

export function InteractiveLiveChart({
  candles,
  signal,
  symbol,
  timeframe,
  height = 600,
  isFullscreen = false,
  onCandleUpdate,
}: InteractiveLiveChartProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showTradingView, setShowTradingView] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [ictBias, setIctBias] = useState<{ bias: string; message: string } | null>(null);
  const candlesRef = useRef<Candle[]>([]);
  const updateQueueRef = useRef<Candle[]>([]);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch ICT Bias
  // TODO: Re-enable when API service is recreated
  // useEffect(() => {
  //   if (!candles || candles.length < 3) return;

  //   const fetchBias = async () => {
  //     try {
  //       // Send last 10 candles to optimize payload
  //       const recentCandles = candles.slice(-10);
  //       const result = await api.post<any>('/strategies/ict-bias', recentCandles);
  //       setIctBias(result);
  //     } catch (error) {
  //       console.error('Error fetching ICT bias:', error);
  //     }
  //   };

  //   // Debounce fetch
  //   const timeout = setTimeout(fetchBias, 2000);
  //   return () => clearTimeout(timeout);
  // }, [candles.length, symbol, timeframe]); // Only re-fetch when candle count changes (new candle) or context changes

  // Initialize chart
  useEffect(() => {
    if (showTradingView || !chartContainerRef.current) return;

    // Clean up previous chart
    if (chartRef.current) {
      try {
        chartRef.current.remove();
      } catch (error) {
        // Ignore cleanup errors
      }
      chartRef.current = null;
      candlestickSeriesRef.current = null;
      setIsInitialized(false);
    }

    // Wait for container to have dimensions
    let retryCount = 0;
    const maxRetries = 50; // Max 5 seconds (50 * 100ms)

    const initChart = () => {
      if (!chartContainerRef.current) {
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(initChart, 100);
        } else {
          console.error('Chart container ref is null after max retries');
        }
        return;
      }

      const container = chartContainerRef.current;
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight || (isFullscreen ? window.innerHeight - 100 : height);

      if (containerWidth === 0 || containerHeight === 0) {
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(initChart, 100);
        } else {
          console.error(`Chart container has zero dimensions after max retries: width=${containerWidth}, height=${containerHeight}`);
        }
        return;
      }

      // Ensure minimum dimensions
      const chartWidth = Math.max(containerWidth, 100);
      const chartHeight = Math.max(containerHeight, 100);

      try {
        // Verify createChart is available
        if (typeof createChart !== 'function') {
          console.error('createChart is not a function. Check lightweight-charts import.');
          console.error('createChart type:', typeof createChart);
          console.error('Available imports:', { createChart, IChartApi, ISeriesApi, ColorType });
          return;
        }

        console.log(`Creating chart with dimensions: ${chartWidth}x${chartHeight} for container: ${containerWidth}x${containerHeight}`);

        const chart = createChart(container, {
          layout: {
            background: { type: ColorType.Solid, color: isDark ? '#0a0e0b' : '#ffffff' },
            textColor: isDark ? '#ffffff' : '#1a1a1a',
            fontSize: 11,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            attributionLogo: false,
          },
          grid: {
            vertLines: {
              color: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(19, 236, 55, 0.05)',
              style: 0,
              visible: true,
            },
            horzLines: {
              color: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(19, 236, 55, 0.05)',
              style: 0,
              visible: true,
            },
          },
          width: chartWidth,
          height: chartHeight,
          timeScale: {
            timeVisible: true,
            secondsVisible: false,
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(19, 236, 55, 0.15)',
            rightOffset: 12,
            barSpacing: 10,
            minBarSpacing: 3,
          },
          rightPriceScale: {
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(19, 236, 55, 0.15)',
            scaleMargins: {
              top: 0.1,
              bottom: 0.1,
            },
          },
          crosshair: {
            mode: 1, // Normal mode
            vertLine: {
              color: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(19, 236, 55, 0.4)',
              width: 1,
              style: 0,
              labelBackgroundColor: isDark ? '#13ec37' : '#13ec37',
            },
            horzLine: {
              color: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(19, 236, 55, 0.4)',
              width: 1,
              style: 0,
              labelBackgroundColor: isDark ? '#13ec37' : '#13ec37',
            },
          },
        });

        if (!chart) {
          console.error('createChart returned null or undefined');
          return;
        }

        // Add candlestick series using v4.x API
        let candlestickSeries;
        try {
          candlestickSeries = chart.addCandlestickSeries({
            upColor: '#13ec37',
            downColor: '#ff4444',
            borderVisible: true,
            borderUpColor: '#13ec37',
            borderDownColor: '#ff4444',
            wickUpColor: '#13ec37',
            wickDownColor: '#ff4444',
            priceFormat: {
              type: 'price',
              precision: 2,
              minMove: 0.01,
            },
          });
          console.log('Candlestick series added successfully');
        } catch (seriesError) {
          console.error('Error adding candlestick series:', seriesError);
          return;
        }

        chartRef.current = chart;
        candlestickSeriesRef.current = candlestickSeries;
        setIsInitialized(true);
        console.log('Chart initialization completed successfully');

        // Handle resize
        const handleResize = () => {
          if (chartContainerRef.current && chartRef.current) {
            chartRef.current.applyOptions({
              width: chartContainerRef.current.clientWidth,
              height: isFullscreen ? window.innerHeight - 100 : height,
            });
          }
        };

        window.addEventListener('resize', handleResize);

        // Cleanup function
        return () => {
          window.removeEventListener('resize', handleResize);
          if (chartRef.current) {
            try {
              // Clean up special lines
              if ((chartRef.current as any).liquiditySweepLine) {
                chartRef.current.removeSeries((chartRef.current as any).liquiditySweepLine);
              }
              if ((chartRef.current as any).displacementLine) {
                chartRef.current.removeSeries((chartRef.current as any).displacementLine);
              }
              chartRef.current.remove();
            } catch (error) {
              console.error('Error removing chart:', error);
            }
            chartRef.current = null;
            candlestickSeriesRef.current = null;
            setIsInitialized(false);
          }
        };
      } catch (error) {
        console.error('Error creating chart:', error);
        return;
      }
    };

    const timeoutId = setTimeout(initChart, 50);

    return () => {
      clearTimeout(timeoutId);
      if (chartRef.current) {
        try {
          chartRef.current.remove();
        } catch (error) {
          // Ignore cleanup errors
        }
        chartRef.current = null;
        candlestickSeriesRef.current = null;
        setIsInitialized(false);
      }
    };
  }, [height, isFullscreen, theme, isDark, showTradingView]);

  // Update chart with candles data (with performance optimization)
  useEffect(() => {
    if (!isInitialized || !candlestickSeriesRef.current || candles.length === 0) {
      return;
    }

    // Limit candles to prevent performance issues (keep last 3000 candles for better chart view)
    const maxCandles = 3000;
    const candlesToUse = candles.length > maxCandles ? candles.slice(-maxCandles) : candles;

    try {
      // Prepare candlestick data
      const chartData = candlesToUse.map((candle) => ({
        time: Math.floor(new Date(candle.openTime).getTime() / 1000) as Time,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
      }));

      // Update series
      candlestickSeriesRef.current.setData(chartData);

      // Update current price
      if (candlesToUse.length > 0) {
        const lastCandle = candlesToUse[candlesToUse.length - 1];
        const prevCandle = candlesToUse.length > 1 ? candlesToUse[candlesToUse.length - 2] : null;

        setCurrentPrice(lastCandle.close);
        if (prevCandle) {
          setPriceChange(((lastCandle.close - prevCandle.close) / prevCandle.close) * 100);
        }
      }

      // Add signal marker and special visual elements if signal exists
      if (signal && chartRef.current && chartData.length > 0) {
        // Find the candle that matches the signal detection time
        const signalDetectedTime = Math.floor(new Date(signal.detectedAt).getTime() / 1000);

        // Search ALL candles for the one closest to signal time
        let signalCandleIndex = -1;
        let bestDiff = Infinity;

        for (let i = 0; i < chartData.length; i++) {
          const candleTime = chartData[i].time as number;
          const diff = Math.abs(candleTime - signalDetectedTime);
          if (diff < bestDiff) {
            bestDiff = diff;
            signalCandleIndex = i;
          }
        }

        console.log('Signal info:', {
          signalDetectedTime: new Date(signalDetectedTime * 1000).toISOString(),
          foundCandleIndex: signalCandleIndex,
          foundCandleTime: signalCandleIndex >= 0 ? new Date((chartData[signalCandleIndex].time as number) * 1000).toISOString() : null,
          timeDiffSeconds: bestDiff,
          signalType: signal.signalType,
          pattern: signal.metadata?.type || signal.metadata?.pattern
        });

        if (signalCandleIndex >= 0) {
          const signalTime = chartData[signalCandleIndex].time;

          // Get pattern type from metadata for better label
          const patternType = signal.metadata?.type || signal.metadata?.pattern || '';
          const direction = signal.signalType === 'BUY' ? 'LONG' : 'SHORT';

          // Format pattern label
          let patternLabel = '';
          if (patternType) {
            // Remove XL and 2X from label logic
            const formattedType = patternType
              .replace('_PLUS', '+')
              .replace('_XL', '')
              .replace('_2X', '')
              .replace('_', ' ');
            patternLabel = formattedType;
          } else {
            patternLabel = direction;
          }

          // Always use arrows for clear visibility
          const markerShape = signal.signalType === 'BUY' ? 'arrowUp' as const : 'arrowDown' as const;

          const marker = {
            time: signalTime,
            position: signal.signalType === 'BUY' ? 'belowBar' as const : 'aboveBar' as const,
            color: signal.signalType === 'BUY' ? '#13ec37' : '#ff4444',
            shape: markerShape,
            text: patternLabel || direction,
            size: 2, // Size 2 is good for arrows
          };

          try {
            candlestickSeriesRef.current.setMarkers([marker]);
          } catch (error) {
            console.error('Error setting marker:', error);
          }

          // Add liquidity sweep line (lowest point before signal)
          if (signalCandleIndex > 0) {
            const candlesBeforeSignal = chartData.slice(0, signalCandleIndex);
            const lowestCandle = candlesBeforeSignal.reduce((min, c) => c.low < min.low ? c : min, candlesBeforeSignal[0]);

            // Clean up previous line if exists
            if ((chartRef.current as any).liquiditySweepLine) {
              try {
                chartRef.current.removeSeries((chartRef.current as any).liquiditySweepLine);
              } catch (e) {
                // Ignore cleanup errors
              }
            }

            // In v4 addLineSeries exists
            const liquiditySweepLine = chartRef.current.addLineSeries({
              color: '#ff4444',
              lineWidth: 1,
              lineStyle: 2, // Dashed
              priceLineVisible: true,
              lastValueVisible: true,
              title: 'Liquidity Sweep',
            });

            // Fix type error for Time arithmetic in v4
            const startTime = chartData[0].time as any;
            const endTime = signalTime as any;

            if (startTime < endTime) {
              liquiditySweepLine.setData([
                { time: startTime, value: lowestCandle.low },
                { time: endTime, value: lowestCandle.low },
              ]);
              // Store reference for cleanup
              (chartRef.current as any).liquiditySweepLine = liquiditySweepLine;
            } else {
              chartRef.current.removeSeries(liquiditySweepLine);
            }
          }

          // Add displacement line (from signal point)
          if (signalCandleIndex >= 0 && signalCandleIndex < chartData.length) {
            const signalCandle = chartData[signalCandleIndex];

            // Clean up previous line if exists
            if ((chartRef.current as any).displacementLine) {
              try {
                chartRef.current.removeSeries((chartRef.current as any).displacementLine);
              } catch (e) {
                // Ignore cleanup errors
              }
            }

            const displacementLine = chartRef.current.addLineSeries({
              color: signal.signalType === 'BUY' ? '#13ec37' : '#ff4444',
              lineWidth: 2,
              lineStyle: 0, // Solid
              priceLineVisible: true,
              lastValueVisible: true,
              title: 'Entry Price',
            });

            // Use signal price if available, otherwise use candle close
            const entryPrice = typeof signal.price === 'number' ? signal.price : signalCandle.close;

            // Fix type error for Time arithmetic in v4
            const entryStartTime = signalTime as any;
            const entryEndTime = chartData[chartData.length - 1].time as any;

            if (entryStartTime < entryEndTime) {
              displacementLine.setData([
                { time: entryStartTime, value: entryPrice },
                { time: entryEndTime, value: entryPrice },
              ]);
              // Store reference for cleanup
              (chartRef.current as any).displacementLine = displacementLine;
            } else {
              chartRef.current.removeSeries(displacementLine);
            }
          }

          // Fit content to show signal
          chartRef.current.timeScale().fitContent();
        }
      }
    } catch (error) {
      console.error('Error updating chart data:', error);
    }
  }, [candles, signal, isInitialized]);

  // Update chart theme when theme changes
  useEffect(() => {
    if (!chartRef.current || !isInitialized) return;

    try {
      chartRef.current.applyOptions({
        layout: {
          background: { type: ColorType.Solid, color: isDark ? '#0a0e0b' : '#ffffff' },
          textColor: isDark ? '#ffffff' : '#1a1a1a',
          fontSize: 11,
        },
        grid: {
          vertLines: {
            color: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(19, 236, 55, 0.08)',
            style: 0,
            visible: true,
          },
          horzLines: {
            color: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(19, 236, 55, 0.08)',
            style: 0,
            visible: true,
          },
        },
        timeScale: {
          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(19, 236, 55, 0.15)',
        },
        rightPriceScale: {
          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(19, 236, 55, 0.15)',
        },
        crosshair: {
          vertLine: {
            color: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(19, 236, 55, 0.4)',
          },
          horzLine: {
            color: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(19, 236, 55, 0.4)',
          },
        },
      });
    } catch (error) {
      console.error('Error updating chart theme:', error);
    }
  }, [theme, isDark, isInitialized]);

  // Update candles ref when candles prop changes
  useEffect(() => {
    candlesRef.current = candles;
  }, [candles]);

  // Handle real-time candle updates with batching and animation
  const handleCandleUpdate = useCallback((newCandle: Candle) => {
    if (newCandle.symbol === symbol && newCandle.timeframe === timeframe) {
      // Add to update queue
      updateQueueRef.current.push(newCandle);
      setLastUpdateTime(new Date());

      // Batch updates to avoid too frequent redraws
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }

      updateTimeoutRef.current = setTimeout(() => {
        const updates = [...updateQueueRef.current];
        updateQueueRef.current = [];

        if (updates.length > 0 && candlestickSeriesRef.current) {
          // Update candles array
          const updatedCandles = [...candlesRef.current];

          updates.forEach((update) => {
            const index = updatedCandles.findIndex(
              c => new Date(c.openTime).getTime() === new Date(update.openTime).getTime()
            );

            if (index >= 0) {
              // Update existing candle with animation
              updatedCandles[index] = update;
            } else {
              // Add new candle with animation
              updatedCandles.push(update);
              updatedCandles.sort((a, b) =>
                new Date(a.openTime).getTime() - new Date(b.openTime).getTime()
              );
            }
          });

          candlesRef.current = updatedCandles;

          // Prepare chart data
          const chartData = updatedCandles.map((candle) => ({
            time: Math.floor(new Date(candle.openTime).getTime() / 1000) as Time,
            open: candle.open,
            high: candle.high,
            low: candle.low,
            close: candle.close,
          }));

          // Smooth update with animation
          requestAnimationFrame(() => {
            if (candlestickSeriesRef.current) {
              candlestickSeriesRef.current.setData(chartData);

              // Re-add signal marker if signal exists (to maintain it after updates)
              if (signal && chartRef.current && chartData.length > 0) {
                const signalDetectedTime = Math.floor(new Date(signal.detectedAt).getTime() / 1000);

                // Search all candles for best match
                let bestIndex = -1;
                let bestDiff = Infinity;

                for (let i = 0; i < chartData.length; i++) {
                  const diff = Math.abs((chartData[i].time as number) - signalDetectedTime);
                  if (diff < bestDiff) {
                    bestDiff = diff;
                    bestIndex = i;
                  }
                }

                if (bestIndex >= 0) {
                  const signalTime = chartData[bestIndex].time;
                  const patternType = signal.metadata?.type || signal.metadata?.pattern || '';
                  const direction = signal.signalType === 'BUY' ? 'LONG' : 'SHORT';

                  // Format pattern label
                  let patternLabel = '';
                  if (patternType) {
                    const formattedType = patternType
                      .replace('_PLUS', '+')
                      .replace('_', ' ');
                    patternLabel = formattedType;
                  } else {
                    patternLabel = direction;
                  }

                  // Always use arrows for visibility
                  const markerShape = signal.signalType === 'BUY' ? 'arrowUp' as const : 'arrowDown' as const;

                  const marker = {
                    time: signalTime,
                    position: signal.signalType === 'BUY' ? 'belowBar' as const : 'aboveBar' as const,
                    color: signal.signalType === 'BUY' ? '#13ec37' : '#ff4444',
                    shape: markerShape,
                    text: patternLabel || direction,
                    size: 3,
                  };

                  try {
                    candlestickSeriesRef.current.setMarkers([marker]);
                  } catch (error) {
                    console.error('Error updating marker:', error);
                  }
                }
              }

              // Update price info
              if (updatedCandles.length > 0) {
                const lastCandle = updatedCandles[updatedCandles.length - 1];
                const prevCandle = updatedCandles.length > 1 ? updatedCandles[updatedCandles.length - 2] : null;

                setCurrentPrice(lastCandle.close);
                if (prevCandle) {
                  setPriceChange(((lastCandle.close - prevCandle.close) / prevCandle.close) * 100);
                }
              }

              // Notify parent component
              if (onCandleUpdate && updates.length > 0) {
                updates.forEach(update => onCandleUpdate(update));
              }
            }
          });
        }
      }, 100); // Batch updates every 100ms
    }
  }, [symbol, timeframe, onCandleUpdate, signal]);

  // Subscribe to WebSocket updates
  // TODO: Re-enable when WebSocket service is recreated
  // useEffect(() => {
  //   if (!symbol || !timeframe) return;

  //   // Subscribe to symbol updates
  //   wsService.subscribeToSymbol(symbol, timeframe);
  //   wsService.on('candle:update', handleCandleUpdate);

  //   return () => {
  //     wsService.off('candle:update', handleCandleUpdate);
  //     wsService.unsubscribeFromSymbol(symbol, timeframe);
  //     if (updateTimeoutRef.current) {
  //       clearTimeout(updateTimeoutRef.current);
  //     }
  //   };
  // }, [symbol, timeframe, handleCandleUpdate]);

  // Chart toolbar functions
  const handleZoomIn = useCallback(() => {
    if (chartRef.current) {
      const timeScale = chartRef.current.timeScale();
      const visibleRange = timeScale.getVisibleRange();
      if (visibleRange) {
        const from = visibleRange.from as any as number;
        const to = visibleRange.to as any as number;
        const range = to - from;
        const center = (from + to) / 2;
        timeScale.setVisibleRange({
          from: (center - range * 0.7) as any,
          to: (center + range * 0.7) as any,
        });
      }
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (chartRef.current) {
      const timeScale = chartRef.current.timeScale();
      const visibleRange = timeScale.getVisibleRange();
      if (visibleRange) {
        const from = visibleRange.from as any as number;
        const to = visibleRange.to as any as number;
        const range = to - from;
        const center = (from + to) / 2;
        timeScale.setVisibleRange({
          from: (center - range * 1.4) as any,
          to: (center + range * 1.4) as any,
        });
      }
    }
  }, []);

  const handleResetZoom = useCallback(() => {
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
    }
  }, []);

  // Convert timeframe to TradingView format
  const getTradingViewTimeframe = useCallback((tf: string): string => {
    const tfLower = tf.toLowerCase();
    if (tfLower === '1m') return '1';
    if (tfLower === '3m') return '3';
    if (tfLower === '5m') return '5';
    if (tfLower === '15m') return '15';
    if (tfLower === '30m') return '30';
    if (tfLower === '1h') return '60';
    if (tfLower === '2h') return '120';
    if (tfLower === '4h') return '240';
    if (tfLower === '6h') return '360';
    if (tfLower === '8h') return '480';
    if (tfLower === '12h') return '720';
    if (tfLower === '1d') return 'D';
    if (tfLower === '3d') return '3D';
    if (tfLower === '1w') return 'W';
    if (tfLower === '1M') return 'M';
    return '240'; // Default to 4h
  }, []);

  // Get TradingView URL
  const getTradingViewUrl = useCallback(() => {
    const tvTimeframe = getTradingViewTimeframe(timeframe);
    return `https://www.tradingview.com/chart/?symbol=BINANCE:${symbol}&interval=${tvTimeframe}`;
  }, [symbol, timeframe, getTradingViewTimeframe]);

  // Calculate volume for last 24h (optimized with memoization)
  const last24hVolume = useMemo(() => {
    if (candles.length === 0) return 0;
    const now = Date.now();
    const last24h = now - 24 * 60 * 60 * 1000;
    // Only check last 200 candles for performance
    const recentCandles = candles.slice(-200);
    return recentCandles
      .filter(c => new Date(c.openTime).getTime() >= last24h)
      .reduce((sum, c) => sum + c.volume, 0);
  }, [candles]);

  return (
    <div className="relative w-full h-full chart-container bg-background-dark/20 backdrop-blur-sm rounded-2xl overflow-hidden border dark:border-white/5 light:border-green-200 shadow-2xl">
      {/* Texture Overlay */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-20 bg-[url('/grid-texture.png')] bg-repeat opacity-[0.03]"></div>

      {/* Toolbar */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="absolute top-4 right-4 z-20 flex items-center gap-2 chart-toolbar pointer-events-auto"
      >
        <div className="flex items-center gap-1 px-2 py-1.5 rounded-xl glass-panel shadow-lg border dark:border-white/10 light:border-green-300">
          <motion.button
            whileHover={{ scale: 1.15, color: '#13ec37' }}
            whileTap={{ scale: 0.9 }}
            onClick={handleZoomIn}
            className="p-2 rounded-lg dark:hover:bg-white/10 light:hover:bg-green-100 dark:text-gray-400 light:text-text-dark transition-all duration-300 chart-toolbar-button"
            title="Zoom In"
          >
            <span className="material-symbols-outlined text-xl">add</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.15, color: '#13ec37' }}
            whileTap={{ scale: 0.9 }}
            onClick={handleZoomOut}
            className="p-2 rounded-lg dark:hover:bg-white/10 light:hover:bg-green-100 dark:text-gray-400 light:text-text-dark transition-all duration-300 chart-toolbar-button"
            title="Zoom Out"
          >
            <span className="material-symbols-outlined text-xl">remove</span>
          </motion.button>
          <div className="w-px h-5 dark:bg-white/10 light:bg-green-300 mx-1"></div>
          <motion.button
            whileHover={{ scale: 1.15, color: '#13ec37' }}
            whileTap={{ scale: 0.9 }}
            onClick={handleResetZoom}
            className="p-2 rounded-lg dark:hover:bg-white/10 light:hover:bg-green-100 dark:text-gray-400 light:text-text-dark transition-all duration-300 chart-toolbar-button"
            title="Reset Zoom"
          >
            <span className="material-symbols-outlined text-xl">fit_screen</span>
          </motion.button>
        </div>
        {signal && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowTradingView(!showTradingView)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl backdrop-blur-xl transition-all duration-300 shadow-lg border group ${showTradingView
              ? 'bg-primary/20 border-primary/50 text-primary shadow-[0_0_15px_rgba(19,236,55,0.2)]'
              : 'glass-panel dark:border-white/10 light:border-green-300 dark:text-gray-300 light:text-text-dark hover:border-primary/30 hover:text-primary'
              }`}
            title={showTradingView ? "Switch to Native Chart" : "Switch to TradingView"}
          >
            <span className="material-symbols-outlined text-xl transition-transform group-hover:rotate-180 duration-500">
              {showTradingView ? 'candlestick_chart' : 'change_history'}
            </span>
            <span className="text-xs font-bold hidden sm:inline uppercase tracking-wider">
              {showTradingView ? 'Native Chart' : 'TradingView'}
            </span>
          </motion.button>
        )}
      </motion.div>

      {/* Price Info Overlay - Bottom Left */}
      {currentPrice !== null && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="absolute bottom-6 left-6 z-20 flex flex-col gap-3 pointer-events-none"
        >
          <div className="flex items-end gap-4">
            <div className="flex flex-col">
              <div className="flex items-baseline gap-3">
                <span className="text-5xl font-black tracking-tighter dark:text-white light:text-text-dark drop-shadow-lg font-mono">
                  {currentPrice.toFixed(2)}
                </span>
                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-sm font-bold backdrop-blur-md border ${priceChange >= 0
                  ? 'bg-green-500/10 border-green-500/20 text-green-500'
                  : 'bg-red-500/10 border-red-500/20 text-red-500'
                  }`}>
                  <span className="material-symbols-outlined text-sm font-black">
                    {priceChange >= 0 ? 'arrow_upward' : 'arrow_downward'}
                  </span>
                  <span>{Math.abs(priceChange).toFixed(2)}%</span>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-1">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${lastUpdateTime && (Date.now() - lastUpdateTime.getTime()) < 5000 ? 'bg-primary animate-pulse shadow-[0_0_8px_#13ec37]' : 'bg-gray-500'}`}></span>
                  <span className="text-xs font-mono uppercase tracking-widest dark:text-gray-400 light:text-text-light-secondary opacity-70">
                    Real-time Data • {symbol} • {timeframe}
                  </span>
                </div>

                {/* ICT Bias Indicator */}
                {ictBias && (
                  <div className="flex items-center gap-2 pl-4 border-l border-white/10">
                    <span className="text-xs font-mono text-gray-400 uppercase tracking-widest opacity-70">BIAS:</span>
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded border ${ictBias.bias === 'BULLISH' ? 'bg-[#13ec37]/10 text-[#13ec37] border-[#13ec37]/20 shadow-[0_0_10px_rgba(19,236,55,0.1)]' :
                        ictBias.bias === 'BEARISH' ? 'bg-[#ff4444]/10 text-[#ff4444] border-[#ff4444]/20 shadow-[0_0_10px_rgba(255,68,68,0.1)]' :
                          'bg-gray-500/10 text-gray-400 border-gray-500/20'
                      }`}>
                      {ictBias.bias}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )
      }
      {/* TradingView Widget Overlay */}
      {
        showTradingView && (
          <div className="absolute inset-0 z-10 bg-background-dark/95 backdrop-blur-sm">
            <TradingViewWidget
              symbol={symbol}
              interval={getTradingViewTimeframe(timeframe)}
              theme={isDark ? 'dark' : 'light'}
              height="100%"
            />
          </div>
        )
      }

      <div ref={chartContainerRef} className="w-full h-full" />
    </div >
  );
}
