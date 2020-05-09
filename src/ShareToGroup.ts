import puppeteer, {Browser, ElementHandle, Page} from "puppeteer";
import {logToFacebook} from "./Utils";
import Logger from "./Logger";

const fs = require('fs');

class ShareToGroup {
    browser: Browser;
    username: string;
    password: string;
    shareTo: Array<string[]> = [['News du Faso'], ['Burkina Kibaria (BurKi)', "DEBAT POLITIQUE", "INFOS ,RIRES ET DÉTENTE"]];

    constructor(browser: Browser) {
        this.browser = browser;
        let json = fs.readFileSync(__dirname + "/credentials.json", {encoding: 'utf-8'});
        let credentials: { username: string, password: string } = JSON.parse(json);
        this.username = credentials.username;
        this.password = credentials.password;
    }

    async share() {
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

        let success = true;

        for (let i = 0; i < this.shareTo[0].length; i++) {
            let shareDialog: ElementHandle | null = await this.openDialog(page, contentWrapper);
            if (!shareDialog) continue;
            success = await this.performShare(shareDialog, this.shareTo[0][i], page)
        }


        for (let i = 0; i < this.shareTo[1].length; i++) {
            let shareDialog: ElementHandle | null = await this.openDialog(page, contentWrapper);
            if (!shareDialog) continue;
            if (await this.changeSharerToUser(shareDialog, page)) {
                success = await this.performShare(shareDialog, this.shareTo[1][i], page)
            } else success = false;
        }


        await page.waitFor(1000 * 3);
        await page.close();

        return success;
    }

    private async openDialog(page: Page, contentWrapper: ElementHandle<Element>) {
        let shareButtonLink: ElementHandle | null = await contentWrapper.$("form a[role=button][title*='Envoyez ceci à vos ']");
        if (!shareButtonLink) {
            Logger.log("Impossible de selection form a[role=button][title*='Envoyez ceci à vos ']");
            return null;
        }
        await shareButtonLink.hover();
        await page.waitFor(1000 * 2);

        let shareButton: ElementHandle | null = await contentWrapper.$('[endpoint="/share/share_now_menu/"]');

        if (!shareButton) {
            Logger.log("Impossible d'acceder au button de partage (selector: [endpoint=\"/share/share_now_menu/\"])");
            return null;
        }

        await shareButton.click();
        await page.waitFor(1000 * 3);
        let handle: ElementHandle | null = await page.$('.uiContextualLayerPositioner:not(.hidden_elem) .uiContextualLayer ul li:nth-child(2)');
        if (!handle) {
            Logger.log("Impossible d'acceder à .uiContextualLayerPositioner:not(.hidden_elem) .uiContextualLayer ul li:nth-child(2)");
            return null;
        }
        await handle.click();
        await page.waitFor(1000 * 3);
        let shareDialog: ElementHandle | undefined = (await page.$$('[role="dialog"]')).pop();
        if (!shareDialog) {
            Logger.log("Impossible d'obtenir le dialogue de partage");
            return null;
        }
        return shareDialog;
    }

    private async changeSharerToUser(shareDialog: ElementHandle<Element>, page: Page) {
        let changeSharerSelect: ElementHandle | null = await shareDialog.$('a[type="button"]');

        if (!changeSharerSelect) {
            Logger.log("Impossible de changer de compte pour partager (problème avec ce sélecteur : a[type='button'])");
            return false;
        }
        await changeSharerSelect.click();
        await page.waitFor(800);
        let changeSharerDialog: ElementHandle | null = await page.$('body > .uiContextualLayerPositioner.uiLayer .uiContextualLayerBelowRight');
        if (!changeSharerDialog) {
            Logger.log("Impossible de changer de compte pour partager (problème avec ce sélecteur : body > .uiContextualLayerPositioner.uiLayer .uiContextualLayerBelowRight)");
            return false;
        }

        let PrevIcon: ElementHandle | null = await changeSharerDialog.$('.showBusiness i');
        if (!PrevIcon) {
            Logger.log("Impossible de changer de compte pour partager (problème avec ce sélecteur : .showBusiness i)");
            return false;
        }
        await page.waitFor(800);
        await PrevIcon.click();

        let changeSharerDialog2: ElementHandle | null = await page.$('body > .uiContextualLayerPositioner.uiLayer .uiContextualLayerBelowRight');
        if (!changeSharerDialog2) {
            Logger.log("Impossible de changer de compte pour partager (problème avec ce sélecteur : body > .uiContextualLayerPositioner.uiLayer .uiContextualLayerBelowRight (2ème occurrence))");
            return false;
        }
        let imgHandler: ElementHandle | null = await changeSharerDialog2.$('img')
        if (!imgHandler) {
            Logger.log("Impossible de changer de compte pour partager (problème avec ce sélecteur : img (impossible de cliquer sur l'avatar))");
            return false;
        }

        await imgHandler.click();
        await page.waitFor(500);
        return true;
    }

    private async performShare(shareDialog: ElementHandle<Element>, group: string, page: Page) {
        let input: ElementHandle | null = await shareDialog.$('input[type="text"]');
        if (!input) {
            Logger.log("Impossible d'obtenir l'input ('input[type=\"text\"]')");
            return false;
        }

        await input.type(group);
        await page.waitFor(1000 * 2);
        await page.keyboard.press("ArrowDown");
        await page.keyboard.press("Enter");
        await page.waitFor(1000);
        let submitButton: ElementHandle | null = await shareDialog.$('button[type="submit"]:nth-child(2)');
        if (!submitButton) {
            Logger.log("Impossible d'acceder au button de d'envoie (button[type='submit']:nth-child(2))");
            return false;
        }
        await submitButton.click();
        await page.waitFor(1000 * 5);
        Logger.log(`Publication "${getTitle()}" a été partagée dans le groupe "${group}"`);
        return true;
    }
}


export const share = async () => {
    let browser: Browser = await puppeteer.launch({
        defaultViewport: null,
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
        await share().then(_success => {
            if (_success) {
                success = true;
                process.exit(1);
            } else {
                success = false;
                Logger.log(`Au moins une erreur s'est produite lors du partage de la publication ${getTitle()}`);
                runAttempts++;
            }
        }).catch(err => {
            Logger.log(err);
            console.log(err);
            runAttempts++;
        });
    }
    process.exit(1);
})();
