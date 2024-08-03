import { Controller, Get } from '@nestjs/common';
import { AutomationService } from './automation.service';

@Controller('automation')
export class AutomationController {
  constructor(private readonly automationService: AutomationService) {}

  @Get('login')
  async login(): Promise<string> {
    return await this.automationService.login();
  }

  @Get('firstPage')
  async firstPage(): Promise<string> {
    return await this.automationService.firstPage();
  }

  @Get('startAutoBattle')
  async startAutoBattle() {
    await this.automationService.startAutoBattle();
  }

  @Get('stopAutoBattle')
  async stopAutoBattle() {
    return await this.automationService.stopAutoBattle();
  }
}
