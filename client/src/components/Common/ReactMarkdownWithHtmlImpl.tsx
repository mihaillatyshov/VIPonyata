import ReactMarkdown from "react-markdown";

import rehypeRaw from "rehype-raw";

import type { ReactMarkdownWithHtmlProps } from "./ReactMarkdownWithHtml";

const ReactMarkdownWithHtmlImpl = ({ rehypePlugins, ...props }: ReactMarkdownWithHtmlProps) => {
    return <ReactMarkdown {...props} rehypePlugins={[rehypeRaw, ...(rehypePlugins ?? [])]} />;
};

export default ReactMarkdownWithHtmlImpl;
