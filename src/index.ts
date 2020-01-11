import puppeteer from "puppeteer"
import Crawler from "./Crawler/Crawler";
import JeuneAfriqueCrawler from "./Crawler/JeuneAfriqueCrawler";

let crawlers: Crawler[] = [new JeuneAfriqueCrawler()];
(async () => {
    const browser = await puppeteer.launch({args: ['--no-sandbox']});
    browser.on('disconnected', async () => {
       console.log('le navigateur s\'est deconnecter')
    });
    for (let i = 0; i < crawlers.length; i++) {
        let crawler: Crawler = crawlers[i];
        await crawler.crawl(browser);
    }

    await browser.close();
})();

