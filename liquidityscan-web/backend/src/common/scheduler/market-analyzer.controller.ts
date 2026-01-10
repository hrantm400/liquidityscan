import { Controller, Post, Get, Query, Logger, Param } from '@nestjs/common';
import { MarketAnalyzerService } from './market-analyzer.service';

@Controller('market-analyzer')
export class MarketAnalyzerController {
  private readonly logger = new Logger(MarketAnalyzerController.name);

  constructor(private marketAnalyzerService: MarketAnalyzerService) {}

  /**
   * Ручной запуск анализа для конкретного таймфрейма
   * POST /api/market-analyzer/analyze?timeframe=1h
   */
  @Post('analyze')
  async analyzeTimeframe(@Query('timeframe') timeframe: string) {
    this.logger.log(`Manual analysis requested for timeframe: ${timeframe}`);
    
    if (!timeframe || !['1h', '4h', '1d', '1w'].includes(timeframe)) {
      return {
        success: false,
        message: 'Invalid timeframe. Use: 1h, 4h, 1d, 1w',
      };
    }

    try {
      // Use reflection to call private method
      await (this.marketAnalyzerService as any).analyzeMarketsForTimeframe(timeframe);
      return {
        success: true,
        message: `Analysis completed for ${timeframe}`,
      };
    } catch (error) {
      this.logger.error(`Error in manual analysis: ${error.message}`);
      return {
        success: false,
        message: error.message || 'Error during analysis',
      };
    }
  }

  /**
   * Запуск анализа для всех таймфреймов
   * POST /api/market-analyzer/analyze-all
   */
  @Post('analyze-all')
  async analyzeAll() {
    this.logger.log('Manual analysis requested for all timeframes');
    
    const timeframes = ['1h', '4h', '1d', '1w'];
    const results: any[] = [];

    for (const timeframe of timeframes) {
      try {
        await (this.marketAnalyzerService as any).analyzeMarketsForTimeframe(timeframe);
        results.push({ timeframe, success: true });
        // Delay between timeframes
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        this.logger.error(`Error analyzing ${timeframe}: ${error.message}`);
        results.push({ timeframe, success: false, error: error.message });
      }
    }

    return {
      success: true,
      message: 'Analysis completed for all timeframes',
      results,
    };
  }

  /**
   * Проверка статуса cron jobs
   * GET /api/market-analyzer/status
   */
  @Get('status')
  getStatus() {
    return {
      cronJobs: {
        '1h': {
          schedule: 'Every hour at :00:30',
          cron: '30 * * * *',
          strategies: ['RSI_DIVERGENCE'],
        },
        '4h': {
          schedule: 'Every 4 hours at :00:30 (00:00, 04:00, 08:00, 12:00, 16:00, 20:00 UTC)',
          cron: '30 0,4,8,12,16,20 * * *',
          strategies: ['SUPER_ENGULFING', 'RSI_DIVERGENCE', 'ICT_BIAS'],
        },
        '1d': {
          schedule: 'Daily at 04:00:30 UTC',
          cron: '30 4 * * *',
          strategies: ['SUPER_ENGULFING', 'RSI_DIVERGENCE', 'ICT_BIAS'],
        },
        '1w': {
          schedule: 'Monday at 04:00:30 UTC',
          cron: '30 4 * * 1',
          strategies: ['SUPER_ENGULFING', 'ICT_BIAS'],
        },
      },
      note: 'All times are in UTC. Add 4 hours for UTC-4 timezone.',
    };
  }
}
