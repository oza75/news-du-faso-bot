import puppeteer from "puppeteer";
import Logger from "./Logger";
import { Article, Job } from "./types";
import Publisher from "./Publisher";
import JobCrawler from "./Crawler/Job/JobCrawler";
import ProfessionalLinkCrawler from "./Crawler/Job/ProfessionalLinkCrawler";
import EmploiBurkinaCrawler from "./Crawler/Job/EmploiBurkinaCrawler";

require('./Db');
const fs = require('fs');
let crawlers: JobCrawler[] = [new ProfessionalLinkCrawler(), new EmploiBurkinaCrawler()];
let runAttempts: number = 0;
let success: boolean = false;

let indexFileExists: boolean = fs.existsSync(__dirname + '/job_index.txt');
let index: number = indexFileExists ? parseInt(fs.readFileSync(__dirname + '/job_index.txt').toString()) : 0;
index = isNaN(index) ? 0 : index;
index = index > crawlers.length - 1 ? 0 : index;
const run = async () => {
    // if (!validTime()) {
    //     Logger.log('Not a moment to publish');
    //     process.exit(0);
    // }

    let result: boolean | undefined = false;
    let attempts: number = 0;

    function getDescription (job: Job) {
        let result: string = '';
        if (job.enterprise) result += `\n- Enterprise: ${job.enterprise}`;
        if (job.field) result += `\n- Domaine: ${job.field}`;
        if (job.studyRequirement) result += `\n- Niveau d'étude: ${job.studyRequirement}`;
        if (job.locality) result += `\n- Localité: ${job.locality}`;
        if (job.deadline) result += `\n- Date limit de dépôt: ${job.deadline}`;
        if (job.provider_url) result += `\n Postuler ici: ${job.provider_url}`;

        return result;
    }

    do {
        const browser = await puppeteer.launch({
            args: ['--disable-gpu', '--no-sandbox', '--single-process',
                '--disable-web-security', '--disable-dev-profile'],
            headless: true
        });
        browser.on('disconnected', async () => {
            Logger.log('le navigateur s\'est deconnecter')
        });

        let crawler: JobCrawler = crawlers[index];
        let job: Job | null = await crawler.crawl(browser);
        await browser.close();

        if (!job) {
            Logger.log(`Aucune offre d'emploi n'est disponible`);
        } else {
            let article: Article = {
                title: "[OFFRE D'EMPLOI] : " + job.title,
                image: { src: job.image, legend: '' },
                published_at: job.published_at,
                source: job.provider,
                description: getDescription(job),
                provider: job.provider,
                url: job.provider_url,
                plainText: "",
                author: null
            };
            result = await new Publisher(article).publish();
        }

        index = index + 1 < crawlers.length ? index + 1 : 0;

        attempts++;

    } while (!result && attempts <= 5);

    fs.writeFileSync(__dirname + '/job_index.txt', index, { flag: 'w+' });
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
