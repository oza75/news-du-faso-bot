import { Browser, ElementHandle, Page } from "puppeteer";
import Logger from "../Logger";
import Parser from "../Parsers/Parser";
import { Article, ProviderArticles } from "../types";
import DbArticle from "../Models/Article";

abstract class Crawler {
    protected url!: string;
    protected name!: string;
    protected browser!: Browser;
    protected dontBrowse: boolean = false;

    public beforeCrawl (browser: Browser) {
        this.browser = browser;
    }

    public async setUrlToPage (page: Page) {
        await page.goto(this.url);
    }

    public async crawl (browser: Browser) {
        this.beforeCrawl(browser);
        let page: Page = await browser.newPage();
        if (!this.dontBrowse) await this.setUrlToPage(page);
        let urls: string[] = await this.handle(page);
        await page.close();
        let url: string | null = await this.getUrlToParse(urls);
        if (!url) return null;
        return await this.parse(url);
    }

    private async getUrlToParse (urls: string[]) {
        let url: string | null = null;
        for (let i = 0; i < urls.length; i++) {
            let res = await DbArticle.findOne({ provider_url: urls[i] });
            if (!res) {
                url = urls[i];
                break;
            }
        }
        return url;
    }

    private async parse (url: string) {
        let article: Article = await this.parser().parse(this.browser, url);
        if (article) {
            article.url = url;
            article.source = this.name;
            article.provider = this.name;
            return article;
        }

        return null;
    }

    protected log (message: any) {
        Logger.log(message + ` on ${this.url}`);
    }

    protected async $ (selector: string, parent: ElementHandle | Page, log: boolean = true) {
        let result: ElementHandle | null = await parent.$(selector);
        if (!result && log) this.log(`${selector} not found`);
        return result;
    }

    public abstract async handle (page: Page): Promise<any>;

    public abstract parser (): Parser;
}

export default Crawler;
