import puppeteer, { Browser, Page } from "puppeteer";
import Logger from "../Logger";
import FasoNetCrawler from "../Crawler/FasoNetCrawler";

const timeout = 180000;
const createBrowser = async () => {
    const browser = await puppeteer.launch({
        args: ['--disable-gpu', '--no-sandbox', '--single-process',
            '--disable-web-security', '--disable-dev-profile'],
        headless: false
    });
    browser.on('disconnected', async () => {
        Logger.log('le navigateur s\'est deconnecter')
    });

    return browser;
};

describe("crawler must return a list of urls", () => {
    let browser: Browser;
    let page: Page;
    beforeAll(async () => {
        browser = await createBrowser();
        page = await browser.newPage();
    });

    afterAll(async () => {
        await page.close();
        await browser.close();
    });

    test("LeFasoNet returns a list of urls", async () => {
        let instance: FasoNetCrawler = new FasoNetCrawler();
        instance.beforeCrawl(browser);
        await instance.setUrlToPage(page);
        let urls: string[] = await instance.handle(page);
        expect(urls.length).toBeGreaterThan(0);
    }, timeout);

});
