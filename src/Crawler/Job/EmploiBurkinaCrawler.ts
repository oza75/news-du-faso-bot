import JobCrawler from "./JobCrawler";
import { ElementHandle, Page } from "puppeteer";
import { Job } from "../../types";
import Logger from "../../Logger";
import DbArticle from "../../Models/Article";

class EmploiBurkinaCrawler extends JobCrawler {
    protected url: string = "https://www.emploiburkina.com/recherche-jobs-burkina-faso";
    protected provider: string = "Emploi Burkina";

    async handle (page: Page): Promise<Job | null> {
        let container: ElementHandle | null = await page.$('.jobsearch-results');
        if (!container) {
            Logger.log("Impossible d'obtenir le container sur " + this.url);
            return null;
        }
        let links: ElementHandle[] = await container.$$('.job-search-result h5 a');
        for (let i = 0; i < links.length; i++) {
            let handle: ElementHandle = links[i];
            let href: string = await handle.evaluate(el => el.getAttribute("href")) as string;
            href = "https://www.emploiburkina.com/" + href;
            let res = await DbArticle.findOne({ provider_url: href });
            if (!res) {
                let job: Job | null = await this.extract(href);
                if (!job) continue;
                else {
                    return job;
                }
            }
        }
        return null;
    }

    private async extract (href: string): Promise<Job | null> {
        let page: Page = await this.browser.newPage();
        await page.goto(href);
        // @ts-ignore
        let job: Job = {};
        let container = await page.$('.jobs-ad-details');
        if (!container) {
            Logger.log("Impossible d'obtenir le container(.jobs-ad-details) sur " + href);
            return null;
        }
        let titleElement: ElementHandle | null = await container.$(".ad-ss-title");
        if (titleElement) {
            job.title = (await titleElement.evaluate(el => el.textContent) as string).split(':').pop();
        }
        let table: ElementHandle | null = await container.$('table.job-ad-criteria');
        if (table) {
            let promises: Promise<any>[] = [];
            promises.push(this.extractField(table, job));
            promises.push(this.extractLocality(table, job));
            promises.push(this.extractLevel(table, job));
            promises.push(this.extractEnterprise(page, job));
            await Promise.all(promises);
            job.published_at = new Date().toISOString();
        }
        job.provider_url = href;
        job.image = "https://www.dreamjob.ma/wp-content/uploads/2019/06/Offres-dEmploi-Dreamjob.ma-37-750x375.png";
        await page.close();

        if (job.title && job.locality && job.studyRequirement && job.field) return job;
        return null;
    }

    private async extractField (container: ElementHandle<Element>, job: Job) {
        let fieldHandle: ElementHandle | null = await container.$('td .field-name-field-offre-metiers');
        if (!fieldHandle) return;
        let fields: ElementHandle[] = await fieldHandle.$$('.field-item');
        let items: (string | null)[] = await Promise.all(fields.map(e => e.evaluate(k => k.textContent))) as (string | null)[];
        job.field = items.reduce((acc: string | null, curr: string | null) => {
            acc = acc + (acc ? ", " : "") + curr;
            return acc;
        }, "") as string;
    }

    private async extractLocality (container: ElementHandle<Element>, job: Job) {
        let handle: ElementHandle | null = await container.$('td .field-name-field-offre-region');
        if (!handle) return;
        job.locality = await handle.evaluate(el => el.textContent) as string;
    }

    private async extractLevel (container: ElementHandle<Element>, job: Job) {
        let handle: ElementHandle | null = await container.$('td .field-name-field-offre-niveau-etude');
        if (!handle) return;
        job.studyRequirement = await handle.evaluate(el => el.textContent) as string;
    }

    private async extractEnterprise (container: Page, job: Job) {
        let handle: ElementHandle | null = await container.$('.job-ad-company .company-title');
        if (!handle) return;
        job.enterprise = await handle.evaluate(el => el.textContent) as string;
    }
}

export default EmploiBurkinaCrawler;
