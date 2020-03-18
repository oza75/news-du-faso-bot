import { Browser, Page } from "puppeteer";
import { Job } from "../../types";
import DbArticle from "../../Models/Article";

abstract class JobCrawler {
    protected url!: string;
    protected browser!: Browser;
    protected browseUrl: boolean = true;
    protected provider!: string;

    public async crawl (browser: Browser): Promise<Job | null> {
        this.browser = browser;
        let page: Page = await this.browser.newPage();
        if (this.browseUrl) await page.goto(this.url);
        let job: Job | null = await this.handle(page);
        await page.close();
        console.log(job);
        if (job) job.provider = this.provider;
        return job;
    }

    public abstract async handle (page: Page): Promise<Job | null>;

    public async getNonUsedUrl (urls: string[]): Promise<string | null> {
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
}

export default JobCrawler;
