import { createFileRoute } from "@tanstack/react-router";
import { BlogArticle, blogArticleHead } from "@/components/site/BlogArticle";
import { findBlogArticle } from "@/content/blog";

const article = findBlogArticle("target-na-cvicenie-psov-prve-cviky");

export const Route = createFileRoute("/blog_/target-na-cvicenie-psov-prve-cviky")({
  head: () => blogArticleHead(article),
  component: () => <BlogArticle article={article} />,
});
