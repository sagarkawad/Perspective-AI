// app/article/page.tsx
import { Suspense } from "react";
import ArticleContent from "../components/ArticleContent";

export default function ArticlePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ArticleContent />
    </Suspense>
  );
}
