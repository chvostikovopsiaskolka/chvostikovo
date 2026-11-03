import { createFileRoute } from "@tanstack/react-router";
import { BlogArticle, blogArticleHead } from "@/components/site/BlogArticle";
import { findBlogArticle } from "@/content/blog";

const article = findBlogArticle("kam-so-psom-pocas-pracovneho-dna");

export const Route = createFileRoute("/blog_/kam-so-psom-pocas-pracovneho-dna")({
  head: () => blogArticleHead(article),
  component: () => <BlogArticle article={article} />,
});
