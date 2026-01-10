import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { createChart, ColorType, Time, CandlestickSeries, HistogramSeries } from 'lightweight-charts';
import { wsService } from '../services/websocket';
import { useTheme } from '../contexts/ThemeContext';

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
  metadata?: any;
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
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const candlesRef = useRef<Candle[]>([]);
  const updateQueueRef = useRef<Candle[]>([]);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Clean up previous chart
    if (chartRef.current) {
      try {
        chartRef.current.remove();
      } catch (error) {
        // Ignore cleanup errors
      }
      chartRef.current = null;
      candlestickSeriesRef.current = null;
      volumeSeriesRef.current = null;
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
            background: { type: ColorType.Solid, color: isDark ? '#0b140d' : '#ffffff' },
            textColor: isDark ? '#ffffff' : '#1a1a1a',
            fontSize: 12,
            attributionLogo: false,
          },
          grid: {
            vertLines: { color: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(19, 236, 55, 0.1)', style: 0 },
            horzLines: { color: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(19, 236, 55, 0.1)', style: 0 },
          },
          width: chartWidth,
          height: chartHeight,
          timeScale: {
            timeVisible: true,
            secondsVisible: false,
            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(19, 236, 55, 0.2)',
            rightOffset: 12,
            barSpacing: 8,
            minBarSpacing: 2,
          },
          rightPriceScale: {
            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(19, 236, 55, 0.2)',
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
              labelBackgroundColor: '#13ec37',
            },
            horzLine: {
              color: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(19, 236, 55, 0.4)',
              width: 1,
              style: 0,
              labelBackgroundColor: '#13ec37',
            },
          },
        });

        if (!chart) {
          console.error('createChart returned null or undefined');
          return;
        }

        // Check if addSeries is available (v5.x API)
        if (typeof chart.addSeries !== 'function') {
          console.error('Chart object does not have addSeries method.');
          console.error('Available methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(chart)));
          return;
        }

        console.log('Chart created successfully, adding candlestick series...');

        // Add candlestick series using v5.x API
        let candlestickSeries;
        try {
          candlestickSeries = chart.addSeries(CandlestickSeries, {
            upColor: '#13ec37',
            downColor: '#ff4444',
            borderVisible: false,
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

        // Add volume series using v5.x API
        let volumeSeries;
        try {
          volumeSeries = chart.addSeries(HistogramSeries, {
            color: '#26a69a',
            priceFormat: {
              type: 'volume',
            },
            priceScaleId: '',
            scaleMargins: {
              top: 0.8,
              bottom: 0,
            },
          });
          console.log('Volume series added successfully');
        } catch (volumeError) {
          console.error('Error adding volume series:', volumeError);
          // Continue without volume series
        }

        chartRef.current = chart;
        candlestickSeriesRef.current = candlestickSeries;
        volumeSeriesRef.current = volumeSeries;
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
            volumeSeriesRef.current = null;
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
        volumeSeriesRef.current = null;
        setIsInitialized(false);
      }
    };
  }, [height, isFullscreen, theme, isDark]);

  // Update chart with candles data (with performance optimization)
  useEffect(() => {
    if (!isInitialized || !candlestickSeriesRef.current || !volumeSeriesRef.current || candles.length === 0) {
      return;
    }

    // Limit candles to prevent performance issues (keep last 1000 candles)
    const maxCandles = 1000;
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

      // Prepare volume data
      const volumeData = candlesToUse.map((candle) => ({
        time: Math.floor(new Date(candle.openTime).getTime() / 1000) as Time,
        value: candle.volume,
        color: candle.close >= candle.open ? 'rgba(19, 236, 55, 0.3)' : 'rgba(255, 68, 68, 0.3)',
      }));

      // Update series
      candlestickSeriesRef.current.setData(chartData);
      volumeSeriesRef.current.setData(volumeData);

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
        const signalTime = Math.floor(new Date(signal.detectedAt).getTime() / 1000) as Time;
        
        // Enhanced signal marker with animation class
        candlestickSeriesRef.current.setMarkers([
          {
            time: signalTime,
            position: signal.signalType === 'BUY' ? ('belowBar' as const) : ('aboveBar' as const),
            color: signal.signalType === 'BUY' ? '#13ec37' : '#ff4444',
            shape: signal.signalType === 'BUY' ? ('arrowUp' as const) : ('arrowDown' as const),
            text: signal.signalType === 'BUY' ? 'LONG' : 'SHORT',
            size: 2,
          },
        ]);

        // Add liquidity sweep line (lowest point before signal)
        const signalIndex = chartData.findIndex(c => c.time >= signalTime);
        if (signalIndex > 0) {
          const candlesBeforeSignal = chartData.slice(0, signalIndex);
          const lowestCandle = candlesBeforeSignal.reduce((min, c) => c.low < min.low ? c : min, candlesBeforeSignal[0]);
          
          const liquiditySweepLine = chartRef.current.addLineSeries({
            color: '#ff4444',
            lineWidth: 1,
            lineStyle: 2, // Dashed
            priceLineVisible: true,
            lastValueVisible: true,
            title: 'Liquidity Sweep',
          });
          
          liquiditySweepLine.setData([
            { time: chartData[0].time, value: lowestCandle.low },
            { time: signalTime, value: lowestCandle.low },
          ]);
          
          // Store reference for cleanup
          (chartRef.current as any).liquiditySweepLine = liquiditySweepLine;
        }

        // Add displacement line (from signal point)
        if (signalIndex >= 0 && signalIndex < chartData.length) {
          const signalCandle = chartData[signalIndex];
          const displacementLine = chartRef.current.addLineSeries({
            color: '#13ec37',
            lineWidth: 2,
            lineStyle: 0, // Solid
            priceLineVisible: true,
            lastValueVisible: true,
            title: 'Displacement',
          });
          
          displacementLine.setData([
            { time: signalTime, value: signalCandle.close },
            { time: chartData[chartData.length - 1].time, value: signalCandle.close },
          ]);
          
          // Store reference for cleanup
          (chartRef.current as any).displacementLine = displacementLine;
        }

        // Fit content to show signal
        chartRef.current.timeScale().fitContent();
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
          background: { type: ColorType.Solid, color: isDark ? '#0b140d' : '#ffffff' },
          textColor: isDark ? '#ffffff' : '#1a1a1a',
        },
        grid: {
          vertLines: { color: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(19, 236, 55, 0.1)', style: 0 },
          horzLines: { color: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(19, 236, 55, 0.1)', style: 0 },
        },
        timeScale: {
          borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(19, 236, 55, 0.2)',
        },
        rightPriceScale: {
          borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(19, 236, 55, 0.2)',
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

        if (updates.length > 0 && candlestickSeriesRef.current && volumeSeriesRef.current) {
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

          const volumeData = updatedCandles.map((candle) => ({
            time: Math.floor(new Date(candle.openTime).getTime() / 1000) as Time,
            value: candle.volume,
            color: candle.close >= candle.open ? 'rgba(19, 236, 55, 0.3)' : 'rgba(255, 68, 68, 0.3)',
          }));

          // Smooth update with animation
          requestAnimationFrame(() => {
            if (candlestickSeriesRef.current && volumeSeriesRef.current) {
              candlestickSeriesRef.current.setData(chartData);
              volumeSeriesRef.current.setData(volumeData);

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
  }, [symbol, timeframe, onCandleUpdate]);

  // Subscribe to WebSocket updates
  useEffect(() => {
    if (!symbol || !timeframe) return;

    // Subscribe to symbol updates
    wsService.subscribeToSymbol(symbol, timeframe);
    wsService.on('candle:update', handleCandleUpdate);

    return () => {
      wsService.off('candle:update', handleCandleUpdate);
      wsService.unsubscribeFromSymbol(symbol, timeframe);
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [symbol, timeframe, handleCandleUpdate]);

  // Chart toolbar functions
  const handleZoomIn = useCallback(() => {
    if (chartRef.current) {
      const timeScale = chartRef.current.timeScale();
      const visibleRange = timeScale.getVisibleRange();
      if (visibleRange) {
        const range = visibleRange.to - visibleRange.from;
        const center = (visibleRange.from + visibleRange.to) / 2;
        timeScale.setVisibleRange({
          from: center - range * 0.7,
          to: center + range * 0.7,
        });
      }
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (chartRef.current) {
      const timeScale = chartRef.current.timeScale();
      const visibleRange = timeScale.getVisibleRange();
      if (visibleRange) {
        const range = visibleRange.to - visibleRange.from;
        const center = (visibleRange.from + visibleRange.to) / 2;
        timeScale.setVisibleRange({
          from: center - range * 1.4,
          to: center + range * 1.4,
        });
      }
    }
  }, []);

  const handleResetZoom = useCallback(() => {
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
    }
  }, []);

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
    <div className="relative w-full h-full chart-container">
      {/* Live Indicator */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="absolute top-4 left-4 z-30 flex items-center gap-2"
      >
        <div className="absolute flex items-center gap-2 px-3 py-1.5 rounded-full dark:bg-black/70 light:bg-white/70 backdrop-blur-md dark:border-primary/30 light:border-primary/30 border">
          <motion.div
            className="w-2 h-2 rounded-full bg-primary"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [1, 0.7, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <span className="text-xs font-bold text-primary uppercase tracking-wider">Live</span>
        </div>
      </motion.div>

      {/* Toolbar */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="absolute top-4 right-4 z-20 flex items-center gap-2 chart-toolbar"
      >
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg dark:bg-black/60 light:bg-white/60 backdrop-blur-md dark:border-white/10 light:border-green-300">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleZoomIn}
            className="p-1.5 rounded dark:hover:bg-white/10 light:hover:bg-green-100 dark:text-gray-300 light:text-text-dark dark:hover:text-white light:hover:text-text-dark transition-colors chart-toolbar-button"
            title="Zoom In"
          >
            <span className="material-symbols-outlined text-lg">add</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleZoomOut}
            className="p-1.5 rounded dark:hover:bg-white/10 light:hover:bg-green-100 dark:text-gray-300 light:text-text-dark dark:hover:text-white light:hover:text-text-dark transition-colors chart-toolbar-button"
            title="Zoom Out"
          >
            <span className="material-symbols-outlined text-lg">remove</span>
          </motion.button>
          <div className="w-px h-4 dark:bg-white/10 light:bg-green-300 mx-1"></div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleResetZoom}
            className="p-1.5 rounded dark:hover:bg-white/10 light:hover:bg-green-100 dark:text-gray-300 light:text-text-dark dark:hover:text-white light:hover:text-text-dark transition-colors chart-toolbar-button"
            title="Reset Zoom"
          >
            <span className="material-symbols-outlined text-lg">fit_screen</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Price Info Overlay - Top Left (moved down to make room for Live indicator) */}
      {currentPrice !== null && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="absolute top-16 left-4 z-20 flex flex-col gap-3 price-info-overlay"
        >
          {/* First Row: Current Price and Signal */}
          <div className="flex items-start gap-3">
            <motion.div
              key={currentPrice}
              initial={{ scale: 1.05 }}
              animate={{ scale: 1 }}
              className={`px-3 py-2 rounded-lg dark:bg-black/70 light:bg-white/70 backdrop-blur-md dark:border-white/10 light:border-green-300 whitespace-nowrap ${
                priceChange > 0 ? 'price-change-positive' : priceChange < 0 ? 'price-change-negative' : ''
              }`}
            >
              <div className="text-xs dark:text-gray-400 light:text-text-light-secondary mb-1">Current Price</div>
              <div className="text-lg font-bold dark:text-white light:text-text-dark font-mono">
                ${currentPrice.toFixed(2)}
              </div>
            </motion.div>
            {signal && (
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className={`px-3 py-2 rounded-lg dark:bg-black/70 light:bg-white/70 backdrop-blur-md border whitespace-nowrap ${
                  signal.signalType === 'BUY' ? 'dark:border-primary/30 light:border-primary/30' : 'dark:border-red-500/30 light:border-red-500/30'
                } ${signal.signalType === 'BUY' ? 'signal-marker' : 'signal-marker-bearish'}`}
              >
                <div className="text-xs dark:text-gray-400 light:text-text-light-secondary mb-1">Signal</div>
                <div className={`text-sm font-bold font-mono ${
                  signal.signalType === 'BUY' ? 'text-primary' : 'text-red-500'
                }`}>
                  {signal.signalType === 'BUY' ? 'LONG' : 'SHORT'}
                </div>
              </motion.div>
            )}
          </div>
          {/* Second Row: 24h Change, Volume, Last Update */}
          <div className="flex items-start gap-3 flex-wrap">
            {priceChange !== 0 && (
              <motion.div
                key={priceChange}
                initial={{ scale: 1.05 }}
                animate={{ scale: 1 }}
                className={`px-3 py-2 rounded-lg dark:bg-black/70 light:bg-white/70 backdrop-blur-md border whitespace-nowrap ${
                  priceChange >= 0 ? 'dark:border-primary/30 light:border-primary/30 text-primary' : 'dark:border-red-500/30 light:border-red-500/30 text-red-500'
                }`}
              >
                <div className="text-xs mb-1">24h Change</div>
                <div className={`text-sm font-bold font-mono ${priceChange >= 0 ? 'text-primary' : 'text-red-500'}`}>
                  {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
                </div>
              </motion.div>
            )}
            {last24hVolume > 0 && (
              <div className="px-3 py-2 rounded-lg dark:bg-black/70 light:bg-white/70 backdrop-blur-md dark:border-white/10 light:border-green-300 whitespace-nowrap">
                <div className="text-xs dark:text-gray-400 light:text-text-light-secondary mb-1">24h Volume</div>
                <div className="text-sm font-bold dark:text-white light:text-text-dark font-mono">
                  {last24hVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
              </div>
            )}
            {lastUpdateTime && (
              <div className="px-3 py-2 rounded-lg dark:bg-black/70 light:bg-white/70 backdrop-blur-md dark:border-white/10 light:border-green-300 whitespace-nowrap">
                <div className="text-xs dark:text-gray-400 light:text-text-light-secondary mb-1">Last Update</div>
                <div className="text-xs font-mono dark:text-white light:text-text-dark">
                  {lastUpdateTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Chart Container */}
      <div 
        ref={chartContainerRef} 
        className="w-full"
        style={{ 
          height: isFullscreen ? 'calc(100vh - 100px)' : `${height}px`,
          minHeight: isFullscreen ? 'calc(100vh - 100px)' : `${height}px`,
          position: 'relative',
        }}
      />
    </div>
  );
}
