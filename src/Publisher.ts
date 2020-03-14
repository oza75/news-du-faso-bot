import { Article, FbArticle } from "./types";
import FB from "./FB";
import Logger from "./Logger";

const { execSync } = require('child_process');
const fs = require('fs');

class Publisher {
    private article!: Article;
    private provider_name!: string;

    constructor (article: Article, provider_name: string) {
        this.article = article;
        this.provider_name = provider_name;
    }

    public async publish () {
        // let summary: string = await this.summarize(this.article.plainText);
        let summary: string | null = this.article.description;
        let article: FbArticle = {
            title: this.article.title,
            image_url: this.article.image.src || null,
            published_at: this.article.published_at || +new Date().toString(),
            provider_url: this.article.url,
            provider_name: this.provider_name,
            message: this.article.title + '\n\n' + summary + '\n\nSource: ' + this.article.source + '\nEn Savoir Plus : ' + this.article.url
        };

        return await new FB().post(article);
    }

    public async summarize (text: string) {
        fs.writeFileSync(__dirname + '/article-to-summarize.txt', text);
        let result = execSync(`ots ${__dirname + '/article-to-summarize.txt'} --ratio=20`).toString();
        try {
            fs.unlinkSync(__dirname + '/article-to-summarize.txt');
        } catch (e) {
            Logger.log(e);
        }
        return result;
    }
}

export default Publisher;
