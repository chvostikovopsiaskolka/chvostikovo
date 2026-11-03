import { createFileRoute } from "@tanstack/react-router";
import { BlogArticle, blogArticleHead } from "@/components/site/BlogArticle";
import { findBlogArticle } from "@/content/blog";

const article = findBlogArticle("je-psia-skolka-vhodna-pre-kazdeho-psa");

export const Route = createFileRoute("/blog_/je-psia-skolka-vhodna-pre-kazdeho-psa")({
  head: () => blogArticleHead(article),
  component: () => <BlogArticle article={article} />,
});
