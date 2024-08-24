import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as playwright from 'playwright';
import { readFileSync } from 'fs';
import { Solver } from '@2captcha/captcha-solver';
import { Cron, CronExpression } from '@nestjs/schedule';
import ms from 'ms';

@Injectable()
export class AutomationService {
  private browser: playwright.Browser | undefined;
  private context: playwright.BrowserContext | undefined;
  private page: playwright.Page | undefined;
  private petPage: playwright.Page | undefined;
  private solver = new Solver(process.env.TWOCAPTCHA_API_KEY);

  private loggedIn = false;
  private enableAutoBattle = false;
  private nextBattleTime = new Date();

  private enableAutoPet = false;
  private nextPetTime = new Date();

  constructor(private readonly configService: ConfigService) {}

  private web_url = 'https://web.idle-mmo.com';

  @Cron(CronExpression.EVERY_SECOND)
  async battleCron() {
    if (!this.enableAutoBattle || !this.loggedIn) return;
    if (new Date().getTime() < this.nextBattleTime.getTime()) return;
    this.nextBattleTime.setTime(new Date().getTime() + 100000000);
    const tmpTime = this.nextBattleTime.getTime();

    console.log('startAutoBattle');
    try {
      await this.nextBattle(this.page);
    } catch (error) {
      console.log(error);
    }
    console.log('endAutoBattle');

    if (this.nextBattleTime.getTime() == tmpTime) {
      this.nextBattleTime.setTime(
        new Date().getTime() + Math.floor(Math.random() * 2000 + 1000),
      );
    }
  }

  @Cron(CronExpression.EVERY_SECOND)
  async petCron() {
    if (!this.enableAutoPet || !this.loggedIn) return;
    if (new Date().getTime() < this.nextPetTime.getTime()) return;

    if (!this.petPage) {
      this.petPage = await this.context.newPage();
    }

    this.nextPetTime.setTime(new Date().getTime() + 100000000);

    console.log('startAutoPet');
    await this.nextPet(this.petPage);
    console.log('endAutoPet');

    this.nextPetTime.setTime(
      new Date().getTime() + Math.floor(Math.random() * ms('10s')) + ms('1m'),
    );

    console.log(this.nextPetTime);
  }

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

    this.loggedIn = true;

    return 'hmm';
  }

  async startAutoBattle() {
    this.enableAutoBattle = true;
  }

  async stopAutoBattle() {
    this.enableAutoBattle = false;
  }

  async startAutoPet() {
    this.enableAutoPet = true;
  }

  async stopAutoPet() {
    this.enableAutoPet = false;
  }

  async nextBattle(page: playwright.Page) {
    await page.goto(this.web_url + '/battle');

    // Add a random delay of 1 to 5 seconds to simulate human behavior
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const startHuntButton = await page.getByText('Start Hunt');
    if (await startHuntButton.isVisible()) {
      await startHuntButton.click();
      console.log('click start hunt');
    }

    const battleMaxButton = await page
      .getByText('Battle Max')
      .locator('xpath=..');

    // wait for visible
    while (true) {
      if (await startHuntButton.isVisible()) return;

      if (!(await battleMaxButton.isVisible()))
        await new Promise((resolve) => setTimeout(resolve, 1000));
      else break;
    }

    // while visible
    while (true) {
      // check world boss
      const worldBossLabel = await page
        .getByText('World Bosses Nearby')
        .locator('xpath=..')
        .locator('xpath=..')
        .locator('xpath=..')
        .locator('xpath=../div[4]');

      const nextWorldBoss = (await worldBossLabel.innerText())
        .split(' ')
        .map((e) => ms(e))
        .reduce((sum, i) => sum + i, 0);

      if (nextWorldBoss < ms('3m')) {
        await worldBossLabel.locator('button').click();
        const joinLobbyButton = await page.getByText('Join Lobby');
        await joinLobbyButton.click();
        console.log('click join lobby');
        this.nextBattleTime.setTime(new Date().getTime() + ms('5m'));
        return;
      }

      if (await battleMaxButton.isVisible()) {
        if (Number((await battleMaxButton.innerText()).split('\n')[1]) != 0) {
          await battleMaxButton.click();
          console.log('click battle max');

          const allQueued = await page
            .getByText('All eligible enemies have been queued.')
            .first();

          await sleep(2000);
          if (Number((await battleMaxButton.innerText()).split('\n')[1]) != 0) {
            if (await allQueued.isVisible()) {
              await page.getByText('Hunt Again').first().click();
              console.log('click hunt again');
            }
          }
        }

        await sleep(3000);
        continue;
      } else {
        break;
      }
    }
  }

  async nextPet(page: playwright.Page) {
    await page.goto(this.web_url + '/pets');

    await sleep(2000);

    const pets = await page
      .locator('xpath=//*[@id="game-container"]/div/div/div[1]/div/div[2]')
      .getByRole('button')
      .all();

    for (const pet of pets) {
      await pet.click();

      await sleep(1000);

      const anotherPlaceLabel = page.getByText(
        'You must travel there to interact with it',
      );

      if (await anotherPlaceLabel.isVisible()) {
        continue;
      }

      const battlingLabel = page.getByText('Battling...');

      if (await battlingLabel.isVisible()) {
        continue;
      }

      const petImage = await page
        .getByText('Battle')
        .locator('xpath=../../../../../div[1]/div[1]/img');
      await petImage.click();

      await sleep(1000);

      const feedButton = page.getByText('Feed').first();
      if (!(await feedButton.isVisible())) {
        continue;
      }
      await feedButton.click();

      await sleep(2000);

      const foodLabels = await page
        .getByText('Food')
        .locator('xpath=..')
        .locator('xpath=../ul')
        .getByRole('listitem');

      const numberOfFood = await foodLabels.count();

      if (!numberOfFood) return;

      const food = (await foodLabels.all()).at(numberOfFood - 1);
      await food.click();
      await page.getByText('Max Health').first().click();

      const minusButton = await page
        .getByText('Max Health')
        .first()
        .locator('xpath=..')
        .locator('xpath=../div[1]/button[1]');
      await minusButton.click();

      const useButton = await page
        .getByText('Use')
        .and(page.getByRole('button'))
        .first();
      await useButton.click();

      while (await useButton.isVisible()) {
        sleep(1000);
      }

      const closeButton = await page
        .getByText('Food')
        .locator('xpath=..')
        .locator('xpath=..')
        .locator('xpath=../button[1]');
      await closeButton.click();

      await page.getByText('Battle').last().click();
      sleep(1000);
    }
  }
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function cfCallback(token: string) {
  throw new Error('Function not implemented.');
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
