import Parser from "./Parser";
import {ElementHandle, Page} from "puppeteer";
import {Article, ArticleContentElement, ArticleImage} from "../types";

class JeuneAfriqueParser extends Parser {

    async handle(page: Page): Promise<any> {
        // @ts-ignore
        let article: Article = {contents: []};
        let content: ElementHandle | null = await page.$('#content article.art-content');
        if (!content) {
            this.log('[error] content (#content article.art-content) not found');
            return;
        }

        await this.getTitleAndPublishedAt(page, article);
        await this.author(content, article);
        await this.image(content, article);
        // await this.content(content, article);
        return article;

    }

    // private async content(content: ElementHandle<Element>, article: Article) {
    //     let articleText: ElementHandle | null = await this.$('.art-text', content);
    //     if (articleText) {
    //         let descriptionHandle: ElementHandle | null = await this.$('p.lead', articleText);
    //         if (descriptionHandle) {
    //             article.description = await descriptionHandle.evaluate(el => el.textContent);
    //         }
    //
    //         let contentElements: ElementHandle[] = await articleText.$$('p:not(.lead):not(.price-hook):not(.subscription-hook),h1,h2,h3,h4,h5,h6,blockquote');
    //         for (let i = 0; i < contentElements.length; i++) {
    //             let elementHandle: ElementHandle = contentElements[i];
    //             let contentElement: ArticleContentElement = await elementHandle.evaluate(el => {
    //                 return {
    //                     type: el.nodeName,
    //                     content: el.textContent
    //                 };
    //             });
    //             if (contentElement.content != 'En savoir plus ?') {
    //                 article.contents.push(contentElement);
    //             }
    //         }
    //
    //         article.plainText = article.contents.reduce((previousValue: any, currentValue: ArticleContentElement) => {
    //             previousValue += "\n";
    //             previousValue += currentValue.content;
    //             return previousValue;
    //         }, article.description);
    //     }
    // }

    private async image(content: ElementHandle<Element>, article: Article) {
        let imageLeadHandle: ElementHandle | null = await this.$('figure.art-thumbnail-lead', content);
        if (imageLeadHandle) {
            // @ts-ignore
            let image: ArticleImage = {};
            let imageHandle: ElementHandle | null = await this.$('img', imageLeadHandle);

            if (imageHandle) {
                image.src = 'https://www.jeuneafrique.com' + await imageHandle.evaluate(el => el.getAttribute('src'));

            }
            let legendHandle: ElementHandle | null = await this.$('figcaption', imageLeadHandle);
            if (legendHandle) {
                image.legend = await legendHandle.evaluate(el => el.textContent);
            }

            article.image = image;
        }
    }

    private async author(content: ElementHandle<Element>, article: Article) {
        let authorHandle: ElementHandle | null = await this.$('.author-desc a', content, false);
        if (authorHandle) {
            article.author = await authorHandle.evaluate(element => element.textContent);
        }
    }

    private async getTitleAndPublishedAt(page: Page, article: Article) {
        let header: ElementHandle | null = await this.$('#main .art-header', page);
        if (header) {
            let h1: ElementHandle | null = await this.$('h1', header);
            let time: ElementHandle | null = await this.$('time', header);
            if (h1) {
                article.title = await h1.evaluate(element => element.textContent);
            }
            if (time) {
                article.published_at = await time.evaluate(element => element.getAttribute('pubdate'));
            }
        }
    }
}

export default JeuneAfriqueParser;
