import { Module } from '@nestjs/common';
import { StrategiesService } from './strategies.service';
import { RsiDivergenceService } from './rsi-divergence.service';
import { SuperEngulfingService } from './super-engulfing.service';
import { IctBiasService } from './ict-bias.service';
import { HammerPatternService } from './hammer-pattern.service';
import { RsiAlertsService } from './rsi-alerts.service';

@Module({
  providers: [
    StrategiesService,
    RsiDivergenceService,
    SuperEngulfingService,
    IctBiasService,
    HammerPatternService,
    RsiAlertsService,
  ],
  exports: [
    StrategiesService,
    RsiDivergenceService,
    SuperEngulfingService,
    IctBiasService,
    HammerPatternService,
    RsiAlertsService,
  ],
})
export class StrategiesModule {}
