// @ts-ignore
import * as mongoose from "mongoose";
import {Schema, Types} from "mongoose";

// @ts-ignore
const ObjectId = Schema.ObjectId;
const Article = mongoose.model('Article', new Schema({
        id: ObjectId,
        provider_name: String,
        provider_url: String,
        published_at: Date
    }
));

export default Article;
