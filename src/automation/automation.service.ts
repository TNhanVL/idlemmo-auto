import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as playwright from 'playwright';
import { readFileSync } from 'fs';
import { Solver } from '@2captcha/captcha-solver';

@Injectable()
export class AutomationService {
  private browser: playwright.Browser | undefined;
  private context: playwright.BrowserContext | undefined;
  private page: playwright.Page | undefined;
  private solver = new Solver(process.env.TWOCAPTCHA_API_KEY);

  constructor(private readonly configService: ConfigService) {}

  private web_url = 'https://web.idle-mmo.com';

  async login(): Promise<string> {
    this.browser = await playwright.chromium.launch({
      headless: false,
      devtools: true,
    });
    this.context = await this.browser.newContext();
    this.page = await this.context.newPage();

    const preloadFile = readFileSync('./src/automation/inject.js', 'utf8');
    await this.page.addInitScript(preloadFile);

    this.page.on('console', async (msg) => {
      const txt = msg.text();
      if (txt.includes('intercepted-params:')) {
        const params = JSON.parse(txt.replace('intercepted-params:', ''));
        console.log(params);

        try {
          console.log(`Solving the captcha...`);
          const res = await this.solver.cloudflareTurnstile(params);
          console.log(`Solved the captcha ${res.id}`);
          console.log(res);
          await this.page.evaluate((token) => {
            cfCallback(token);
          }, res.data);
        } catch (e) {
          console.log(e.err);
          return process.exit();
        }
      } else {
        return;
      }
    });

    // wait for request that body included 'chlApiSitekey'
    // const getCaptchaWaitResponse = this.page.waitForResponse(
    //   async (response) => {
    //     if (response.status() != 200) return false;
    //     return (await response.body()).toString().includes('chlApiSitekey');
    //   },
    // );

    // // wait for request that body included 'login'
    // const loginPageResponse = this.page.waitForResponse(async (response) => {
    //   if (response.status() != 200) return false;
    //   return (await response.body()).toString().includes('login');
    // });

    // wait for checkbox
    // const checkboxCaptchaResponse = this.page.waitForResponse(
    //   async (response) => {
    //     if (response.status() != 200) return false;
    //     return (await response.body()).toString().includes('checkbox');
    //   },
    // );

    // wait for checkbox
    const loginPageResponse = this.page.waitForResponse(async (response) => {
      if (response.status() != 200) return false;
      return (await response.body()).toString().includes('Log in');
    });

    await this.page.goto(this.web_url);

    // // Add a random delay of 1 to 5 seconds to simulate human behavior
    // await new Promise((resolve) =>
    //   setTimeout(resolve, Math.floor(Math.random() * 4000 + 1000)),
    // );

    // // Scroll the page to load additional content
    // await this.page.evaluate(() => window.scrollBy(0, window.innerHeight));

    // // Add another random delay of 1 to 5 seconds
    // await new Promise((resolve) =>
    //   setTimeout(resolve, Math.floor(Math.random() * 4000 + 1000)),
    // );

    // let websiteKey = (await (await getCaptchaWaitResponse).body()).toString();

    // // Get data sitekey to solve recaptcha
    // const match = websiteKey.match(/chlApiSitekey: \'(.+)\'/);
    // // if (!match || !match[1]) return false;
    // websiteKey = match[1];

    // console.log(1);

    // await new Promise((resolve) =>
    //   setTimeout(resolve, Math.floor(Math.random() * 2000 + 5000)),
    // );

    // await checkboxCaptchaResponse;

    // console.log(2);

    // await new Promise((resolve) =>
    //   setTimeout(resolve, Math.floor(Math.random() * 2000 + 500)),
    // );

    // console.log(3);

    // await this.page.getByRole('checkbox').setChecked(true);

    // console.log(4);

    await loginPageResponse;

    // const content = await this.page.content();

    // return content;

    // const cookies = await this.context.cookies();

    // this.browser = await playwright.chromium.launch({
    //   headless: true,
    // });
    // this.context = await this.browser.newContext();
    // this.page = await this.context.newPage();
    // this.context.addCookies(cookies);

    const loginButton = (await this.page.getByText('Log in').all()).at(0);
    // console.log(loginButton);
    await loginButton.click();

    await this.page
      .locator('#email')
      .pressSequentially(process.env.IDLEMMO_EMAIL);

    await this.page
      .locator('#password')
      .pressSequentially(process.env.IDLEMMO_PASSWORD);

    await (await this.page.getByText('Login').all()).at(0).click();

    return 'hmm';
  }

  async firstPage(): Promise<string> {
    await this.page.goto(this.web_url);

    // Add a random delay of 1 to 5 seconds to simulate human behavior
    await new Promise((resolve) =>
      setTimeout(resolve, Math.floor(Math.random() * 1000)),
    );

    const content = await this.page.content();

    return content;
  }
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function cfCallback(token: string) {
  throw new Error('Function not implemented.');
}
