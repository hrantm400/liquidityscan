import { Controller, Get, Query, Param, Post, Body, Delete, Logger } from '@nestjs/common';
import { SignalsService } from './signals.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UseGuards } from '@nestjs/common';

@Controller('signals')
export class SignalsController {
  private readonly logger = new Logger(SignalsController.name);

  constructor(private readonly signalsService: SignalsService) {}

  @Get()
  async getSignals(
    @Query('strategyType') strategyType?: string,
    @Query('symbol') symbol?: string,
    @Query('timeframe') timeframe?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    this.logger.log(`GET /signals - strategyType: ${strategyType}, timeframe: ${timeframe}, limit: ${limit}`);
    const result = await this.signalsService.getSignals({
      strategyType,
      symbol,
      timeframe,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });
    this.logger.log(`GET /signals - returning ${Array.isArray(result) ? result.length : 0} signals`);
    return result;
  }

  // ВАЖНО: candles должен быть перед :id, иначе 'candles' будет интерпретироваться как id
  @Get('candles')
  async getCandles(
    @Query('symbol') symbol: string,
    @Query('timeframe') timeframe: string,
    @Query('limit') limit?: string,
  ) {
    this.logger.log(`GET /signals/candles - symbol: ${symbol}, timeframe: ${timeframe}, limit: ${limit}`);
    try {
      const candles = await this.signalsService.getCandles(symbol, timeframe, limit ? parseInt(limit) : 500);
      this.logger.log(`GET /signals/candles - returning ${candles.length} candles`);
      return candles;
    } catch (error) {
      this.logger.error(`Error in getCandles: ${error.message}`);
      return [];
    }
  }

  @Delete('all')
  async clearAllSignals() {
    this.logger.warn('⚠️  Clearing all signals from database...');
    const result = await this.signalsService.clearAllSignals();
    this.logger.log(`✅ Cleared ${result.count} signals`);
    return { 
      success: true, 
      deleted: result.count,
      message: `Successfully deleted ${result.count} signals` 
    };
  }

  @Post('generate')
  @UseGuards(JwtAuthGuard)
  async generateSignals(@Body() data: { symbol: string; timeframe: string }) {
    return this.signalsService.generateSignals(data.symbol, data.timeframe);
  }

  @Get(':id')
  async getSignalById(@Param('id') id: string) {
    return this.signalsService.getSignalById(id);
  }
}
