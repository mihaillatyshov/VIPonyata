import { lazy, Suspense } from "react";
import type ReactMarkdown from "react-markdown";

type T = Parameters<typeof ReactMarkdown>[0];

export interface ReactMarkdownWithHtmlProps extends T {
    children: string;
}

// react-markdown + rehype-raw весят ~100 КБ gzip — грузим их отдельным чанком только там, где есть markdown.
const ReactMarkdownWithHtmlImpl = lazy(() => import("./ReactMarkdownWithHtmlImpl"));

export const ReactMarkdownWithHtml = (props: ReactMarkdownWithHtmlProps) => {
    return (
        <Suspense fallback={null}>
            <ReactMarkdownWithHtmlImpl {...props} />
        </Suspense>
    );
};
