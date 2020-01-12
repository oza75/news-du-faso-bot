import Crawler from "./Crawler";
import {ElementHandle, JSHandle, Page} from "puppeteer";
import Logger from "../Logger";
import Parser from "../Parsers/Parser";
import JeuneAfriqueParser from "../Parsers/JeuneAfriqueParser";

class JeuneAfriqueCrawler extends Crawler {
    protected url: string = 'https://www.jeuneafrique.com/pays/burkina-faso/';
    protected name: string = 'Jeune Afrique';

    async handle(page: Page): Promise<any> {
        let urls: string[] = [];
        let container: ElementHandle | null = await page.$('.mea-articles');
        if (!container) {
            this.log('.mea-articles not found');
            return;
        }

        await this.mainArticle(container, urls);
        await this.articles(container, urls);

        return urls;
    }

    public parser(): Parser {
        return new JeuneAfriqueParser();
    }

    private async articles(container: ElementHandle<Element>, urls: string[]) {
        let mainArticles: ElementHandle | null = await container.$('.main-articles');
        if (!mainArticles) {
            this.log(".main-articles not found");
        } else {
            let articles: ElementHandle[] = await mainArticles.$$(".main-articles div:not(.secondary-art-list) article");
            for (let i = 0; i < articles.length; i++) {
                let article: ElementHandle = articles[i];
                let link: ElementHandle | null = await article.$('a');
                if (link) {
                    let linkHandle: JSHandle = await link.getProperty('href');
                    urls.push(await linkHandle.jsonValue() as string)
                }
            }
        }
    }

    private async mainArticle(container: ElementHandle<Element>, urls: string[]) {
        let mainArticle: ElementHandle | null = await container.$("article#main-lead-art");
        if (!mainArticle) {
            this.log("MainArticle (#main-lead-art) not found");
        } else {
            let mainArticleLink: ElementHandle | null = await mainArticle.$("a");
            if (!mainArticleLink) {
                this.log('main article link was not found')
            } else {
                let link: JSHandle = await mainArticleLink.getProperty('href');
                urls.push(await link.jsonValue() as string);
            }
        }
    }
}

export default JeuneAfriqueCrawler;
