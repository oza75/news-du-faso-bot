import {Browser, Page} from "puppeteer";
import Logger from "../Logger";
import Parser from "../Parsers/Parser";

abstract class Crawler {
    protected url!: string;
    protected browser!: Browser;

    public async crawl(browser: Browser) {
        this.browser = browser;
        let page: Page = await browser.newPage();
        await page.goto(this.url);
        let urls: string[] = await this.handle(page);
        console.log(urls);
        await page.close();
        await this.parse(urls);
    }

    private async parse(urls: string[]) {
        for (let i = 0; i < urls.length; i++) {
            let url: string = urls[i];
            await this.parser().parse(this.browser, url);
        }
    }

    protected log(message: any) {
        Logger.log(message + ` on ${this.url}`);
    }

    public abstract async handle(page: Page): Promise<any>;

    public abstract parser(): Parser;
}

export default Crawler;
