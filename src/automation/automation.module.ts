import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AutomationController } from './automation.controller';
import { AutomationService } from './automation.service';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [ConfigModule, ScheduleModule.forRoot()],
  controllers: [AutomationController],
  providers: [AutomationService],
})
export class AutomationModule {}
