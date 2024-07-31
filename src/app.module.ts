import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { AutomationModule } from './automation/automation.module';
import credentialConfig from './config/credential.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [credentialConfig],
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    AutomationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
