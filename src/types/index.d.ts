export interface Article {
    url: string,
    title: string | null,
    published_at: string | number | null,
    author: string | null,
    image: ArticleImage,
    description: string | null,
    contents: ArticleContentElement[],
    plainText: string,
    source: string
}

export interface ArticleContentElement {
    type: string,
    content: string | null,
}

export interface ArticleImage {
    src: string | null,
    legend: string | null
}

export interface ProviderArticles {
    provider: string,
    articles: Article[]
}

export interface FbPage {
    access_token: string,
    name: string,
    id: string
}

export interface FbArticle {
    title: string | null,
    image_url: string | null,
    message: string,
    provider_url: string,
    provider_name: string,
    published_at: string | number
}
