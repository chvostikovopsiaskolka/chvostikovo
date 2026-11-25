import { createFileRoute } from "@tanstack/react-router";
import { BlogArticle, blogArticleHead } from "@/components/site/BlogArticle";
import { findBlogArticle } from "@/content/blog";
const article = findBlogArticle("target-pri-rehabilitacii-psa");
export const Route = createFileRoute("/blog_/target-pri-rehabilitacii-psa")({
  head: () => blogArticleHead(article),
  component: () => <BlogArticle article={article} />,
});
