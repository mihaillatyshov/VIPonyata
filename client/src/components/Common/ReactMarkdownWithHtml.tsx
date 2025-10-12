import ReactMarkdown from "react-markdown";

import rehypeRaw from "rehype-raw";

type T = Parameters<typeof ReactMarkdown>[0];

interface ReactMarkdownWithHtmlProps extends T {
    children: string;
}

export const ReactMarkdownWithHtml = ({ children }: ReactMarkdownWithHtmlProps) => {
    return <ReactMarkdown rehypePlugins={[rehypeRaw]}>{children}</ReactMarkdown>;
};
