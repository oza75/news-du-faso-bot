import {Browser, ElementHandle, Page} from "puppeteer";
import Logger from "./Logger";

const fs = require('fs');
const puppeteer = require('puppeteer');

class ShareToGroup {
    private browser !: Browser;
    private username !: string;
    private password !: string;

    constructor(browser?: Browser) {
        if (browser) this.browser = browser;
        let json = fs.readFileSync(__dirname + "/credentials.json", {encoding: 'utf-8'});
        let credentials: { username: string, password: string } = JSON.parse(json);
        this.username = credentials.username;
        this.password = credentials.password;
    }

    async share(url: string) {
        let page: Page = await this.browser.newPage();
        page.setDefaultTimeout(1000*60);
        await page.goto('https://www.facebook.com/');
        await page.focus('#login_form #email');
        await page.keyboard.type(this.username);
        await page.focus("#login_form #pass");
        await page.keyboard.type(this.password);
        await page.click("#login_form #loginbutton input");
        await page.waitForNavigation();
        await page.goto("https://www.facebook.com/groups/1038474066182398/");
        await page.waitForSelector("#pagelet_group_composer form textarea", {timeout: 1000 * 60});
        await page.focus("#pagelet_group_composer form textarea");
        await page.evaluate(url => {
            navigator.clipboard.writeText(url);
        }, url);
        await page.waitFor(1000);
        await page.keyboard.down('Control');
        await page.keyboard.press('V');
        await page.keyboard.up('Control');
        await page.waitFor(1000 * 8);
        let status = 0;
        await page.exposeFunction('setPostedStatus', function (s, d = null) {
            status = s;
            if (d) {
                Logger.log("Erreur lors du partage: " + d);
            }
        });

        await page.evaluate(() => {
            let btns = document.querySelectorAll("#pagelet_group_composer button[type='submit']");
            if (btns.length >= 2) {
                try {
                    (btns[1] as HTMLElement).click();
                } catch (e) {
                    // @ts-ignore
                    window.setPostedStatus(0, e.message);
                }
                // @ts-ignore
                window.setPostedStatus(1);
            }
        });
        await page.waitFor(1000 * 30);
        await page.close();
        if (status == 1) {
            Logger.log(`Publication : ${url} partagée`);
        } else {
            Logger.log(`Erreur lors du partage de la publication : ${url}`);
        }
    }

    async createBrowserAndShare(url: string) {
        let browser: Browser = await puppeteer.launch({
            args: ['--disable-gpu', '--no-sandbox', '--single-process',
                '--disable-web-security', '--disable-dev-profile'],
            headless: true
        });
        this.browser = browser;
        await this.share(url);
        await this.browser.close();
    }
}

export default ShareToGroup;

