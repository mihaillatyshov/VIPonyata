import React, { HTMLAttributeAnchorTarget } from "react";

interface TextWithLinksProps {
    text: string;
    linkMaxChars?: number;
    target?: HTMLAttributeAnchorTarget;
}

export const TextWithLinks = ({ text, linkMaxChars, target = "_blank" }: TextWithLinksProps) => {
    const res: (string | React.ReactNode)[] = [];

    const getLinkStr = (link: string) => {
        if (linkMaxChars && link.length > linkMaxChars) {
            return link.slice(0, linkMaxChars) + "...";
        }

        return link;
    };

    const onLinkClick = (e: React.MouseEvent<HTMLElement>) => {
        e.stopPropagation();
    };

    text.replace(
        /((?:https?:\/\/|ftps?:\/\/|\bwww\.)(?:(?![.,?!;:()]*(?:\s|$))[^\s]){2,})|(\n+|(?:(?!(?:https?:\/\/|ftp:\/\/|\bwww\.)(?:(?![.,?!;:()]*(?:\s|$))[^\s]){2,}).)+)/gim,
        (m, link, str) => {
            res.push(
                link ? (
                    <a
                        href={(link[0] === "w" ? "//" : "") + link}
                        key={res.length}
                        target={target}
                        onClick={onLinkClick}
                    >
                        {getLinkStr(link)}
                    </a>
                ) : (
                    str
                ),
            );
            return str;
        },
    );

    return <div className="user-text">{res}</div>;
};
