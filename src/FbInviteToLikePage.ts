import { Browser, ElementHandle, Page } from "puppeteer";
import puppeteer from "puppeteer";
import Logger from "./Logger";

const fs = require('fs');

class FbInviteToLikePage {
    browser: Browser;
    username: string;
    password: string;

    constructor (browser: Browser) {
        this.browser = browser;
        let json = fs.readFileSync(__dirname + "/credentials.json", { encoding: 'utf-8' });
        let credentials: { username: string, password: string } = JSON.parse(json);
        this.username = credentials.username;
        this.password = credentials.password;
    }

    public async invite () {
        const context = this.browser.defaultBrowserContext();
        await context.overridePermissions("https://www.facebook.com", ["geolocation", "notifications"]);
        let page: Page = await this.browser.newPage();
        await logToFacebook(page, this.username, this.password);

        await page.goto("https://www.facebook.com/newsdufaso.bf/notifications/");
        let content: ElementHandle | null = await page.$(".fb_content");
        if (!content) {
            Logger.log("Impossible d'inviter les gens à aimer la page car j'arrive pas à obtenir le contenu de la page de notification.")
            return;
        }
        let likeMentionsLinkHandle: ElementHandle | null = await content.$('[role="menuitem"] ul li:nth-child(2)');
        if (!likeMentionsLinkHandle) {
            Logger.log("Impossible d'obtenir l'url de la page de notifications des 'mentions j'aimes' ! ");
            return;
        }

        await likeMentionsLinkHandle.click();
        await page.waitFor(1000 * 2);
        for (let i = 0; i < 5; i++) {
            await page.evaluate(() => {
                window.scrollBy(0, window.innerHeight);
            });
            await page.waitFor(1000 * 2);
        }

        let linksHandles: ElementHandle[] = await content.$$('[role="main"] ul li a[target="_self"]');
        for (let i = 0; i < linksHandles.length; i++) {
            let handle: ElementHandle = linksHandles[i];

            let url: string = await handle.evaluate(el => el.getAttribute('href')) as string;
            if (!url.includes('=page_post_reaction')) {
                continue;
            }
            await handle.click();
            await page.waitFor(1000 * 3);
            let dialog: ElementHandle | undefined = (await page.$$('[role="dialog"]')).pop();

            if (!dialog) {
                continue;
            }

            let likeHandle = await dialog.$('[role="toolbar"]');
            if (!likeHandle) continue;
            await likeHandle.click();
            await page.waitFor(1000 * 3);

            let likeDialog: ElementHandle | undefined = (await page.$$('[role="dialog"]')).pop();
            if (!likeDialog) continue;
            let uiMorePager = await likeDialog.$('.uiMorePager');
            while (uiMorePager) {
                await uiMorePager.click();
                await page.waitFor(1000 * 3);
                uiMorePager = await likeDialog.$('.uiMorePager');
            }

            let inviteBtns = await likeDialog.$$("ul li a[role='button'][ajaxify]");
            for (let j = 0; j < inviteBtns.length; j++) {
                let btnHandle: ElementHandle = inviteBtns[j];
                let href: string = await btnHandle.evaluate(el => el.getAttribute('ajaxify')) as string;
                if (!href.includes("post_like_invite")) continue;
                await btnHandle.click();
            }
            await page.keyboard.press("Escape");
            await page.waitFor(100);
            await page.keyboard.down("Escape");
            await page.waitFor(500);
            await page.keyboard.press("Escape");
            await page.waitFor(100);
            await page.keyboard.down("Escape");
            await page.waitFor(500);
        }

        await page.waitFor(1000 * 5);
    }


}

export const logToFacebook = async (page: Page, username: string, password: string) => {
    page.setDefaultTimeout(1000 * 60);
    await page.goto('https://www.facebook.com/');
    await page.focus('#login_form #email');
    await page.keyboard.type(username);
    await page.focus("#login_form #pass");
    await page.keyboard.type(password);
    await page.click("#login_form #loginbutton input");
    await page.waitForNavigation();
};

const invite = async function () {
    let browser: Browser = await puppeteer.launch({
        args: ['--disable-gpu', '--no-sandbox', '--single-process',
            '--disable-web-security', '--disable-dev-profile'],
        headless: true
    });
    let instance: FbInviteToLikePage = new FbInviteToLikePage(browser);
    await instance.invite();
    await browser.close();
};
invite().then(e => {
    Logger.log("Invitations envoyées !!")
}).catch(e => {
    Logger.log(e);
}).finally();
