import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AutomationController } from './automation.controller';
import { AutomationService } from './automation.service';

@Module({
  imports: [ConfigModule],
  controllers: [AutomationController],
  providers: [AutomationService],
})
export class AutomationModule {}
