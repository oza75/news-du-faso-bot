import Crawler from "./Crawler";
import Parser from "../Parsers/Parser";
import { ElementHandle, Page } from "puppeteer";
import FasoNetParser from "../Parsers/FasoNetParser";


class FasoNetCrawlerOLD extends Crawler {
    protected url: string = 'https://lefaso.net/spip.php';
    protected baseUrl: string = 'https://lefaso.net/';
    protected name: string = 'LEFASO.NET';
    protected dontBrowse: boolean = true;

    async handle (page: Page): Promise<any> {
        let containers: ElementHandle[] = await page.$$('.container');
        let container: ElementHandle | null = containers[3] || null;
        let topArticleHandle: ElementHandle | null = await this.$('.row', container);
        let urls: string[] = [];
        if (!container || !topArticleHandle) {
            this.log('Container not found ! ');
            return [];
        }
        await this.topArticleUrls(topArticleHandle, urls);
        let articles: ElementHandle[] = await topArticleHandle.$$('.col-xs-12.col-sm-6.col-md-4.col-lg-4 .col-xs-12.col-sm-12.col-md-12.col-lg-12');
        articles = articles.slice(0, 12);
        for (let i = 0; i < articles.length; i++) {
            let linkHandles: ElementHandle[] = await articles[i].$$('a');
            let linkHandle: ElementHandle | null = linkHandles[1];
            let link: string | null | undefined = await linkHandle?.evaluate(el => el.getAttribute('href'));
            if (link) urls.push(link);
        }

        urls = urls.map(url => this.baseUrl + url);

        return urls;
    }

    private async topArticleUrls (container: ElementHandle<Element>, urls: string[]) {
        if (container) {
            let articles: ElementHandle[] = await container.$$('.col-xs-12.col-sm-12.col-md-6.col-lg-6');
            let topArticles = articles.slice(0, 2);
            for (let i = 0; i < topArticles.length; i++) {
                let linkHandle: ElementHandle | null = await this.$('a', topArticles[i]);
                let link: string | null | undefined = await linkHandle?.evaluate(el => el.getAttribute('href'));
                if (link) urls.push(link);
            }
        }
    }

    parser (): Parser {
        return new FasoNetParser();
    }
}

export default FasoNetCrawler;
