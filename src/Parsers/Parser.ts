import {Browser, Page} from "puppeteer";

abstract class Parser {
    protected url!: string;

    public async parse(browser: Browser, url: string): Promise<any> {
        this.url = url;
        let page: Page = await browser.newPage();
        await page.goto(this.url);
        return await this.handle(page);
    }

    public abstract async handle(page: Page): Promise<any>;
}

export default Parser;
