import Crawler from "./Crawler";
import { Page } from "puppeteer";
import Parser from "../Parsers/Parser";
import France24Parser from "../Parsers/France24Parser";
import axios from "axios";

const XmlParser = require('xml2js').Parser;

class France24Crawler extends Crawler {
    protected url: string = 'https://www.france24.com/fr/rss';
    protected baseUrl: string = 'https://www.france24.com/fr/';
    protected name: string = "FRANCE 24";
    protected dontBrowse: boolean = true;

    async handle (page: Page): Promise<any> {
        let res = await axios.get("https://www.france24.com/fr/rss");
        if (res.status >= 200 && res.status < 300) {
            let parser = new XmlParser();
            let result = await parser.parseStringPromise(res.data);
            let channel = result.rss.channel[0];
            let items = channel.item;

            if (items) {
                let urls = items.map((item: any) => item.link);
                urls = urls.reduce((acc: string[], curr: string[]) => {
                    if (curr && curr[0]) acc.push(curr[0]);
                    return acc;
                }, []);
                return urls;
            }
        }
        return [];
    }

    parser (): Parser {
        return new France24Parser();
    }
}

export default France24Crawler;
