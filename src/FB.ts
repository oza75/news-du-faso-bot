import axios, { AxiosError } from 'axios'
import { FbArticle, FbPage } from "./types";
import Article from "./Models/Article";

const mongoose = require('mongoose');
const fs = require('fs');
import Logger from "./Logger";
import { Browser } from "puppeteer";

const { exec } = require("child_process");
require('./Db');

class FB {
    private access_token!: string;
    private user_id: string = '1031436286983041';
    private url: string = 'https://graph.facebook.com/';
    private fbPage!: FbPage;

    async fetchPage () {
        this.access_token = await fs.readFileSync(__dirname + '/access_token.txt').toString('utf-8');
        const res = await axios.get(`${this.url}${this.user_id}/accounts?access_token=${this.access_token}`);
        if (res.status == 200) {
            this.fbPage = res.data.data[1];
        }
    }

    async post (article: FbArticle): Promise<boolean> {
        await this.fetchPage();
        if (!this.fbPage) return false;
        const art_res = await Article.create({
            id: new mongoose.Types.ObjectId(),
            provider_name: article.provider_name,
            provider_url: article.provider_url,
            published_at: new Date(article.published_at)
        });

        if (art_res) {
            return await new Promise((resolve, reject) => {
                return axios.post(`${this.url}${this.fbPage.id}/photos?access_token=${this.fbPage.access_token}`, {
                    url: article.image_url,
                    message: article.message
                }).then(async res => {
                    Logger.log('Article Publié : ' + article.title);
                    exec(`node ${__dirname}/ShareToGroup.js --title="${article.title}"`);
                    resolve(true);
                }).catch(err => {
                    Logger.log(err);
                    resolve(false);
                })
            });
        } else {
            return false;
        }

    }

}

export default FB;
