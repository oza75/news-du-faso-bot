import Parser from "./Parser";
import { ElementHandle, Page } from "puppeteer";
import { Article } from "../types";

class France24Parser extends Parser {
    async handle (page: Page): Promise<any> {
        // @ts-ignore
        let article: Article = { contents: [], image: {} };
        let container: ElementHandle | null = await page.$('article');
        if (!container) {
            this.log('Container not found ! ');
            return null;
        }

        let promises: Promise<any>[] = [];

        promises.push(this.title(container, article));
        promises.push(this.time(container, article));
        promises.push(this.image(container, article));
        promises.push(this.description(container, article));

        await Promise.all(promises);
        console.log(article);
        return article;
    }

    private async title (container: ElementHandle<Element>, article: Article) {
        let titleHandle: ElementHandle | null = await this.$("h1.a-page-title", container);
        if (titleHandle) {
            article.title = await titleHandle.evaluate(el => el.textContent) as string;
            if (article.title) article.title = "[INTERNATIONAL] " + article.title;
        }
    }

    private async time (container: ElementHandle<Element>, article: Article) {
        let handle: ElementHandle | null = await this.$(".t-content__dates time", container);
        if (handle) {
            article.published_at = await handle.evaluate(el => el.getAttribute("datetime")) as string || new Date().toISOString();
        }
    }

    private async image (container: ElementHandle<Element>, article: Article) {
        let handle: ElementHandle | null = await this.$(".t-content__main-media figure img", container);
        if (handle) {
            article.image.src = await handle.evaluate(el => el.getAttribute("src")) as string;
        }
    }

    private async description (container: ElementHandle<Element>, article: Article) {
        let handle: ElementHandle | null = await this.$(".t-content__chapo", container);
        if (handle) {
            article.description = await handle.evaluate(el => el.textContent) as string;
            if (article.description) article.description = article.description.trim();
        }
    }
}

export default France24Parser;
