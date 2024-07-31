import { registerAs } from '@nestjs/config';

export interface CredentialConfig {
  idlemmo_email: string;
  idlemmo_password: string;
}

export default registerAs('credential', () => {
  const credentialConfig: CredentialConfig = {
    idlemmo_email: process.env.IDLEMMO_EMAIL,
    idlemmo_password: process.env.IDLEMMO_PASSWORD,
  };
  return credentialConfig;
});
