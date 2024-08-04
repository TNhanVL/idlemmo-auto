import { Controller, Get } from '@nestjs/common';
import { AutomationService } from './automation.service';

@Controller('automation')
export class AutomationController {
  constructor(private readonly automationService: AutomationService) {}

  @Get('login')
  async login(): Promise<string> {
    return await this.automationService.login();
  }

  @Get('startAutoBattle')
  async startAutoBattle() {
    await this.automationService.startAutoBattle();
  }

  @Get('stopAutoBattle')
  async stopAutoBattle() {
    return await this.automationService.stopAutoBattle();
  }

  @Get('startAutoPet')
  async startAutoPet() {
    await this.automationService.startAutoPet();
  }

  @Get('stopAutoPet')
  async stopAutoPet() {
    return await this.automationService.stopAutoPet();
  }
}
