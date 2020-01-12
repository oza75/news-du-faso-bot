import {Browser, ElementHandle, Page} from "puppeteer";
import Logger from "../Logger";

abstract class Parser {
    protected url!: string;

    public async parse(browser: Browser, url: string): Promise<any> {
        this.url = url;
        let page: Page = await browser.newPage();
        await page.goto(this.url);
        return await this.handle(page);
    }

    protected log(message: any) {
        Logger.log(message + ` on ${this.url}`);
    }

    protected async $(selector: string, parent: ElementHandle | Page, log: boolean = true) {
        let result: ElementHandle | null = await parent.$(selector);
        if (!result && log) this.log(`${selector} not found`);
        return result;
    }

    public abstract async handle(page: Page): Promise<any>;
}

export default Parser;
