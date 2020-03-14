import Parser from "./Parser";
import {ElementHandle, Page} from "puppeteer";
import {Article, ArticleContentElement} from "../types";

class FasoNetParser extends Parser {
    async handle(page: Page): Promise<any> {
        // @ts-ignore
        let article: Article = {contents: [], image: {}};
        let containers: ElementHandle[] = await page.$$('.container');
        let container: ElementHandle | null = containers[2] || null;
        let contentContainer: ElementHandle | null = await container?.$('.row .col-xs-12.col-sm-12.col-md-8.col-lg-8');
        if (!container || !contentContainer) {
            this.log('Container not found ! ');
            return null;
        }
        await this.title(container, article);
        await this.time(container, article);
        await this.image(contentContainer, article);
        await this.description(contentContainer, article);
        // await this.articleContent(contentContainer, article);
        // article.contents.pop();
        // article.plainText = article.contents.reduce((previousValue: any, currentValue: ArticleContentElement) => {
        //     previousValue += "\n";
        //     previousValue += currentValue.content;
        //     return previousValue;
        // }, article.description);

        return article;
    }

    // private async articleContent(contentContainer: ElementHandle<Element>, article: Article) {
    //     let articleContent: ElementHandle | null = await this.$('.article_content', contentContainer);
    //     let contentElements: ElementHandle[] = await articleContent?.$$('p,h1,h2,h3,h4,h5,h6,blockquote') || [];
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

    private async description(contentContainer: ElementHandle<Element>, article: Article) {
        let descriptionHandle: ElementHandle | null = await this.$('h3', contentContainer);
        article.description = await descriptionHandle?.evaluate(el => el.textContent) || null;
    }

    private async image(contentContainer: ElementHandle<Element>, article: Article) {
        let imageHandle: ElementHandle | null = await this.$('img', contentContainer);
        let imageUrl: string | null | undefined = await imageHandle?.evaluate(el => el.getAttribute('src'));
        article.image.src = 'https://lefaso.net/' + imageUrl;
        return imageUrl;
    }

    private async time(container: ElementHandle<Element>, article: Article) {
        let timeHandle: ElementHandle | null = await this.$('.row #hierarchie abbr.published', container);
        article.published_at = await timeHandle?.evaluate(el => el.getAttribute('title')) || new Date().toISOString();
    }

    private async title(container: ElementHandle<Element>, article: Article) {
        let titleHandle: ElementHandle | null = await this.$('.row .entry-title', container);
        article.title = await titleHandle?.evaluate(el => el.textContent) || null;
    }
}

export default FasoNetParser;
