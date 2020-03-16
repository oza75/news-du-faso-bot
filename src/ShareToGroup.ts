import puppeteer, { Browser, ElementHandle, Page } from "puppeteer";
import { logToFacebook } from "./Utils";
import Logger from "./Logger";

const fs = require('fs');

class ShareToGroup {
    browser: Browser;
    username: string;
    password: string;
    shareTo: string[] = ['News du Faso'];

    constructor (browser: Browser) {
        this.browser = browser;
        let json = fs.readFileSync(__dirname + "/credentials.json", { encoding: 'utf-8' });
        let credentials: { username: string, password: string } = JSON.parse(json);
        this.username = credentials.username;
        this.password = credentials.password;
    }

    async share () {
        const context = this.browser.defaultBrowserContext();
        await context.overridePermissions("https://www.facebook.com", ["geolocation", "notifications"]);
        let page: Page = await this.browser.newPage();
        await logToFacebook(page, this.username, this.password);
        await page.goto("https://www.facebook.com/pg/newsdufaso.bf/posts/?ref=page_internal");
        let contentWrapper: ElementHandle | null = await page.$('.userContentWrapper');
        if (!contentWrapper) {
            Logger.log("Impossible de selectionner le .userContentWrapper");
            return false;
        }
        let shareButtonLink: ElementHandle | null = await contentWrapper.$("form a[role=button][title*='Envoyez ceci à vos ']");
        if (!shareButtonLink) {
            Logger.log("Impossible de selection form a[role=button][title*='Envoyez ceci à vos ']");
            return false;
        }
        await shareButtonLink.hover();
        await page.waitFor(1000 * 2);

        let shareButton: ElementHandle | null = await contentWrapper.$('[endpoint="/share/share_now_menu/"]');

        if (!shareButton) {
            Logger.log("Impossible d'acceder au button de partage (selector: [endpoint=\"/share/share_now_menu/\"])");
            return false;
        }
        let error = false;
        for (let i = 0; i < this.shareTo.length; i++) {
            error = false;
            let group: string = this.shareTo[i];
            await shareButton.click();
            await page.waitFor(1000 * 3);
            let handle: ElementHandle | null = await page.$('.uiContextualLayerPositioner:not(.hidden_elem) .uiContextualLayer ul li:nth-child(2)');
            if (!handle) {
                Logger.log("Impossible d'acceder à .uiContextualLayerPositioner:not(.hidden_elem) .uiContextualLayer ul li:nth-child(2)");
                error = true;
                continue;
            }
            await handle.click();
            await page.waitFor(1000 * 3);
            let shareDialog: ElementHandle | undefined = (await page.$$('[role="dialog"]')).pop();
            if (!shareDialog) {
                Logger.log("Impossible d'obtenir le dialogue de partage");
                error = true;
                continue;
            }
            let input: ElementHandle | null = await shareDialog.$('input[type="text"]');
            if (!input) {
                Logger.log("Impossible d'obtenir l'input ('input[type=\"text\"]')");
                error = true;
                continue;
            }

            await input.type(group);
            await page.waitFor(1000 * 2);
            await page.keyboard.press("ArrowDown");
            await page.keyboard.press("Enter");
            await page.waitFor(1000);
            let submitButton: ElementHandle | null = await shareDialog.$('button[type="submit"]:nth-child(2)');
            if (!submitButton) {
                Logger.log("Impossible d'acceder au button de d'envoie (button[type='submit']:nth-child(2))");
                error = true;
                continue;
            }
            await submitButton.click();
            await page.waitFor(1000 * 5);
        }

        await page.waitFor(1000 * 3);
        await page.close();

        return !error;
    }
}


export const share = async () => {
    let browser: Browser = await puppeteer.launch({
        args: ['--disable-gpu', '--no-sandbox', '--single-process',
            '--disable-web-security', '--disable-dev-profile'],
        headless: true
    });
    let instance: ShareToGroup = new ShareToGroup(browser);
    let result = await instance.share();
    await browser.close();
    return result;
};

const getTitle = () => {
    let title: string | null | undefined = process.argv[2] || null;
    title = title ? title.split("=").pop() : null;
    return title;
};

let runAttempts = 0;
let success = false;

(async () => {
    while (runAttempts <= 3 && !success) {
        await share().then(success => {
            if (success) {
                Logger.log(`Publication ${getTitle()} partagée !`);
                success = true;
                process.exit(1);
            } else {
                success = false;
                runAttempts++;
            }
        }).catch(err => {
            Logger.log(err);
            runAttempts++;
        });
    }
    process.exit(1);
})();
