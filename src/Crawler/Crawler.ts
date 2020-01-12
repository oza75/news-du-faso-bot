import {Browser, Page} from "puppeteer";
import Logger from "../Logger";
import Parser from "../Parsers/Parser";
import {Article, ProviderArticles} from "../types";

abstract class Crawler {
    protected url!: string;
    protected name!: string;
    protected browser!: Browser;

    public async crawl(browser: Browser) {
        this.browser = browser;
        let page: Page = await browser.newPage();
        await page.goto(this.url);
        let urls: string[] = await this.handle(page);
        await page.close();
        return await this.parse(urls);
    }

    private async parse(urls: string[]) {
        let providerArticles: ProviderArticles = {provider: this.name, articles: []};
        for (let i = 0; i < urls.length; i++) {
            let url: string = urls[i];
            let article: Article = await this.parser().parse(this.browser, url);
            article.url = url;
            article.source = this.name;
            providerArticles.articles.push(article);
        }
        return providerArticles;
    }

    protected log(message: any) {
        Logger.log(message + ` on ${this.url}`);
    }

    public abstract async handle(page: Page): Promise<any>;

    public abstract parser(): Parser;
}

export default Crawler;
