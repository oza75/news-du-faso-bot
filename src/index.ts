import puppeteer from "puppeteer"
import Crawler from "./Crawler/Crawler";
import JeuneAfriqueCrawler from "./Crawler/JeuneAfriqueCrawler";
import {ProviderArticles} from "./types";
import Article from "./Models/Article";
import Logger from "./Logger";
import Publisher from "./Publisher";
import FasoNetCrawler from "./Crawler/FasoNetCrawler";
import Burkina24Crawler from "./Crawler/Burkina24Crawler";

require('./Db');
const fs = require('fs');
let crawlers: Crawler[] = [new FasoNetCrawler(), new JeuneAfriqueCrawler(), new Burkina24Crawler()];
let runAttempts: number = 0;
let success: boolean = false;

let indexFileExists: boolean = fs.existsSync(__dirname + '/index.txt');
let index: number = indexFileExists ? parseInt(fs.readFileSync(__dirname + '/index.txt').toString()) : 0;
index = isNaN(index) ? 0 : index;
index = index > crawlers.length - 1 ? 0 : index;

const validTime = () => {
    let startTime = new Date();
    startTime.setHours(8, 0, 0);
    let endTime = new Date();
    endTime.setHours(24, 0, 0);
    let nowTime = new Date();
    return startTime <= nowTime && endTime >= nowTime;
};
const run = async () => {
    if (!validTime()) {
        Logger.log('Not a moment to publish');
        process.exit(0);
    }

    let result: boolean | undefined = false;
    let attempts: number = 0;

    do {
        const browser = await puppeteer.launch({
            args: ['--disable-gpu', '--no-sandbox', '--single-process',
                '--disable-web-security', '--disable-dev-profile'],
            headless: false
        });
        browser.on('disconnected', async () => {
            Logger.log('le navigateur s\'est deconnecter')
        });
        let chromeTmpDataDir = null;

// find chrome user data dir (puppeteer_dev_profile-XXXXX) to delete it after it had been used
        // @ts-ignore
        let chromeSpawnArgs = browser.process().spawnargs;
        for (let i = 0; i < chromeSpawnArgs.length; i++) {
            if (chromeSpawnArgs[i].indexOf("--user-data-dir=") === 0) {
                chromeTmpDataDir = chromeSpawnArgs[i].replace("--user-data-dir=", "");
            }
        }

        let crawler: Crawler = crawlers[index];
        let provider: ProviderArticles = await crawler.crawl(browser);

        await browser.close();

        if (chromeTmpDataDir !== null) {
            try {
                fs.unlinkSync(chromeTmpDataDir);
            } catch (e) {
                Logger.log(e);
            }
        }

        let article: any = null;
        for (let i = 0; i < provider.articles.length; i++) {
            let art = provider.articles[i];
            let res = await Article.findOne({provider_url: art.url});
            if (!res) {
                article = art;
                break;
            }
        }

        if (!article) {
            Logger.log(`Aucun article n'est disponible`);
        } else {
            result = await new Publisher(article, provider.provider).publish();
        }

        index = index + 1 < crawlers.length ? index + 1 : 0;

        attempts++;

    } while (!result && attempts <= 5);

    fs.writeFileSync(__dirname + '/index.txt', index);
    process.exit(0);
};

(async () => {
    while (runAttempts <= 5 && !success) {
        await run().then(res => {
            success = true;
        }).catch(err => {
            Logger.log(err);
            runAttempts++;
        });
    }
    process.exit(1);
})();



