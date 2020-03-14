import Parser from "./Parser";
import {ElementHandle, Page} from "puppeteer";
import {Article, ArticleContentElement, ArticleImage} from "../types";

class Burkina24Parser extends Parser {
    async handle(page: Page): Promise<any> {
        // @ts-ignore
        let article: Article = {contents: [], image: {}};
        let container: ElementHandle | null = await page.$('.content-holder article');
        if (!container) {
            this.log('Container  not found !');
            return null;
        }

        let promises: Promise<any>[] = [];
        promises.push(this.title(container, article));
        promises.push(this.image(container, article));
        promises.push(this.publishedAt(container, article));
        promises.push(this.description(container, article));
        promises.push(this.author(container, article));
        // promises.push(this.contents(container, article));

        await Promise.all(promises);
        // article.contents.shift();
        // article.contents.pop();
        // article.contents.pop();
        // article.contents.pop();
        // article.plainText = article.contents.reduce((previousValue: any, currentValue: ArticleContentElement) => {
        //     previousValue += "\n";
        //     previousValue += currentValue.content;
        //     return previousValue;
        // }, article.description);
        return article;
    }

    private async title(container: ElementHandle<Element>, article: Article) {
        let titleHandle: ElementHandle | null = await this.$('header.entry-header h1.entry-title', container);
        if (!titleHandle) return;
        article.title = await titleHandle.evaluate(el => el.textContent) as string;
    }

    private async image(container: ElementHandle<Element>, article: Article) {
        let imageHandle: ElementHandle | null = await this.$('header.entry-header .post-thumb img', container);
        if (!imageHandle) return null;
        // @ts-ignore
        let image: ArticleImage = {};
        image.src = await imageHandle.evaluate(el => el.getAttribute('data-src'));
        article.image = image;
    }

    private async description(container: ElementHandle<Element>, article: Article) {
        let descriptionHandle: ElementHandle | null = await this.$('.page-content p:first-child', container);
        if (!descriptionHandle) return null;
        article.description = await descriptionHandle.evaluate(el => el.textContent);
    }

    private async publishedAt(container: ElementHandle<Element>, article: Article) {
        let publishedAtHandle: ElementHandle | null = await this.$('header.entry-header .meta-post-area .posted-on .published', container);
        if (!publishedAtHandle) return null;
        article.published_at = await publishedAtHandle.evaluate(el => el.getAttribute('datetime')) || new Date().toISOString();
    }

    private async author(container: ElementHandle<Element>, article: Article) {
        let authorHandle: ElementHandle | null = await this.$('header.entry-header .meta-post-area .author a', container);
        if (!authorHandle) return null;
        article.author = await authorHandle.evaluate(el => el.textContent);
    }

    // private async contents(container: ElementHandle<Element>, article: Article) {
    //     let articleContent: ElementHandle | null = await this.$('.page-content', container);
    //     if (!articleContent) return null;
    //     let contentElements: ElementHandle[] = await articleContent.$$('p,h1,h2,h3,h4,h5,h6,blockquote') || [];
    //     for (let i = 0; i < contentElements.length; i++) {
    //         let elementHandle: ElementHandle = contentElements[i];
    //         let contentElement: ArticleContentElement = await elementHandle.evaluate(el => {
    //             return {
    //                 type: el.nodeName,
    //                 content: el.textContent
    //             };
    //         });
    //         article.contents.push(contentElement);
    //     }
    // }
}

export default Burkina24Parser;
