import axios, {AxiosError} from 'axios'
import {FbArticle, FbPage} from "./types";
import Article from "./Models/Article";

const mongoose = require('mongoose');
const fs = require('fs');
import Logger from "./Logger";

require('./Db');

class FB {
    private access_token!: string;
    private user_id: string = '1031436286983041';
    private url: string = 'https://graph.facebook.com/';
    private fbPage!: FbPage;

    async fetchPage() {
        this.access_token = await fs.readFileSync(__dirname + '/access_token.txt').toString('utf-8');
        const res = await axios.get(`${this.url}${this.user_id}/accounts?access_token=${this.access_token}`);
        if (res.status == 200) {
            this.fbPage = res.data.data[0];
        }
    }

    async post(article: FbArticle) {
        await this.fetchPage();
        if (!this.fbPage) return;
        const art_res = await Article.create({
            id: new mongoose.Types.ObjectId(),
            provider_name: article.provider_name,
            provider_url: article.provider_url,
            published_at: new Date(article.published_at)
        });

        if (art_res) {
            const res = await axios.post(`${this.url}${this.fbPage.id}/photos?access_token=${this.fbPage.access_token}`, {
                url: article.image_url,
                message: article.message
            });

            if (res.status == 200) {
                Logger.log('Article Publié : ' + article.title);
                return true;
            } else return false;

        } else {
            return false;
        }

    }
}

export default FB;
