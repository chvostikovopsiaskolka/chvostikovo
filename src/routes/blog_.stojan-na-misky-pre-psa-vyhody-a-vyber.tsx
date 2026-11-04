import { createFileRoute } from "@tanstack/react-router";
import { BlogArticle, blogArticleHead } from "@/components/site/BlogArticle";
import { findBlogArticle } from "@/content/blog";

const article = findBlogArticle("stojan-na-misky-pre-psa-vyhody-a-vyber");

export const Route = createFileRoute("/blog_/stojan-na-misky-pre-psa-vyhody-a-vyber")({
  head: () => blogArticleHead(article),
  component: () => <BlogArticle article={article} />,
});
