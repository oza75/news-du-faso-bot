import Crawler from "./Crawler";
import {ElementHandle, Page} from "puppeteer";
import Parser from "../Parsers/Parser";
import Burkina24Parser from "../Parsers/Burkina24Parser";

class Burkina24CrawlerOLD extends Crawler {
    protected url: string = "https://www.burkina24.com/";
    protected name: string = "Burkina 24";

    async handle(page: Page): Promise<any> {
        let urls: string[] = [];
        let linksHandle: ElementHandle[] = await page.$$('#post-carousel-container-unq-1 .swiper-slide h2.title a');
        for (let i = 0; i < linksHandle.length; i++) {
            try {
                let linkHandle: ElementHandle = linksHandle[i];
                let url: string = await linkHandle.evaluate(el => el.getAttribute('href')) as string;
                urls.push(url);
            } catch (e) {
                this.log('Error: ' + e.messsage)
            }
        }
        return urls;
    }

    parser(): Parser {
        return new Burkina24Parser();
    }

}

export default Burkina24Crawler;
