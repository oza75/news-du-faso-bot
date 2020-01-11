export interface Article {
    title: string,
    published_at: string | number,
    author?: string,
    image: ArticleImage,
}

export interface ArticleImage {
    src: string,
    legend?: string
}
