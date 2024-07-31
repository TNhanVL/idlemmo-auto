import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CredentialConfig } from 'src/config/credential.config';

@Injectable()
export class AutomationService {
  constructor(private readonly configService: ConfigService) {}

  getHello(): string {
    const credentialConfig =
      this.configService.get<CredentialConfig>('credential');
    console.log(credentialConfig);
    return 'Hello World!';
  }
}
