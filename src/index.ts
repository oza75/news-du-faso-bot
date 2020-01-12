import puppeteer from "puppeteer"
import Crawler from "./Crawler/Crawler";
import JeuneAfriqueCrawler from "./Crawler/JeuneAfriqueCrawler";
import {ProviderArticles} from "./types";
import {randomInt} from "./Utils";
import Article from "./Models/Article";
import Logger from "./Logger";
import Publisher from "./Publisher";

require('./Db');
const fs = require('fs');

let providers: ProviderArticles[] = [];
let crawlers: Crawler[] = [new JeuneAfriqueCrawler()];
let runAttempts: number = 0;
let success: boolean = false;

const run = async () => {
    const browser = await puppeteer.launch({
        args: ['--disable-gpu', '--no-sandbox', '--single-process',
            '--disable-web-security', '--disable-dev-profile'],
        headless: true
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

    for (let i = 0; i < crawlers.length; i++) {
        let crawler: Crawler = crawlers[i];
        providers.push(await crawler.crawl(browser));
    }
    await browser.close();

    if (chromeTmpDataDir !== null) {
        try {
            fs.unlinkSync(chromeTmpDataDir);
        } catch (e) {
            Logger.log(e);
        }
    }

    let result: boolean | undefined = false;
    let attempts: number = 0;
    do {
        attempts++;
        let attemps = 0;
        let article: any = null;
        let provider: any = null;
        do {
            attemps++;
            provider = providers[randomInt(providers.length)];
            for (let i = 0; i < provider.articles.length; i++) {
                let art = provider.articles[i];
                let res = await Article.findOne({provider_url: art.url});
                if (!res) {
                    article = art;
                    break;
                }
            }
        } while (!article && attemps <= 5);

        if (!article) {
            Logger.log(`Aucun article n'est disponible`);
        } else {
            result = await new Publisher(article, provider.provider).publish();
        }

    } while (!result && attempts <= 5);

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



