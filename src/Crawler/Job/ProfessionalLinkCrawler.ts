import JobCrawler from "./JobCrawler";
import { Job } from "../../types";
import { ElementHandle, Page } from "puppeteer";
import DbArticle from "../../Models/Article";

class ProfessionalLinkCrawler extends JobCrawler {
    protected url: string = "https://professionnallink.com/accueil/accueil1offre/";
    protected provider: string = "Professionnal Link";

    async handle (page: Page): Promise<Job | null> {
        let links: ElementHandle[] = await page.$$('.accordions a');
        let link: ElementHandle | null = null;
        let url: string | null = null;
        for (let i = 0; i < links.length; i++) {
            let handle: ElementHandle = links[0];
            let href: string = await handle.evaluate(el => el.getAttribute('href')) as string;
            href = href.replace('../../', 'https://professionnallink.com/');
            let res = await DbArticle.findOne({ provider_url: href });
            if (!res) {
                let text: string = await handle.evaluate(el => el.textContent) as string;
                if (text.includes("Burkina")) {
                    link = handle;
                    url = href;
                    break;
                }
            }
        }

        if (!link) return null;
        // @ts-ignore
        let job: Job = {};
        let title: ElementHandle | null = await link.$('h2');
        let content: ElementHandle | null = await link.$('h4');
        if (title) {
            job.title = (await title.evaluate(el => el.textContent) as string).replace("\n", '');
        }
        if (content) {
            let contentString: string = await content.evaluate(el => el.textContent) as string;
            let parts: string[] = contentString.split('|');
            parts = parts.map(part => {
                return part.split(':').pop();
            }) as string[];
            job.enterprise = (parts[0] || '').replace("\n", "").trim();
            job.deadline = parts[1] || undefined;
            job.locality = (parts[2] || '').replace(/Burkina(.*)Faso/gm, '').replace('/', '').trim();
            job.studyRequirement = parts[3] || undefined;
            job.field = parts[4] || undefined;
            if (job.studyRequirement) job.studyRequirement = job.studyRequirement.trim().replace("\n", "");
            if (job.deadline) job.deadline = job.deadline.trim().replace("\n", "");
            if (job.field) job.field = job.field.trim().replace("\n", "");
            job.image = "https://www.dreamjob.ma/wp-content/uploads/2019/06/Offres-dEmploi-Dreamjob.ma-37-750x375.png";
            job.published_at = new Date().toISOString();
            if (url) job.provider_url = url;
        }

        return job;
    }

    private getDate (date: string | null) {
        if (!date) return new Date();
        let parts = date.split('à').map(el => el.trim());

        try {
            let datePart = parts[0];
            let dateArgs: number[] = datePart.split('-').reverse().map(el => parseInt(el));
            dateArgs[1] = dateArgs[1] - 1;
            let timePart = parts[1] || null;
            // @ts-ignore
            if (!timePart) return new Date(...dateArgs);
            let timeAgrs: number[] = timePart.split(':').map(el => parseInt(el));
            console.log(dateArgs, timeAgrs);
            // @ts-ignore
            return new Date(...dateArgs, ...timeAgrs);
        } catch (e) {
            return new Date();
        }

    }
}

export default ProfessionalLinkCrawler;
