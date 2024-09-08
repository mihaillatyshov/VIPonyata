import React, { HTMLAttributeAnchorTarget } from "react";

interface ChatUrlLinkMdProps {
    href?: string;
    children?: React.ReactNode;
}

export const ChatUrlLinkMd = ({ href, children }: ChatUrlLinkMdProps) => {
    const onLinkClick = (e: React.MouseEvent<HTMLElement>) => {
        e.stopPropagation();
    };
    return (
        <a href={href} style={{ textDecoration: "underline" }} onClick={onLinkClick} target="_blank" rel="noreferrer">
            {children}
        </a>
    );
};

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

export const TextWithLinksForMd = ({ text, linkMaxChars }: TextWithLinksProps) => {
    const getLinkStr = (link: string) => {
        if (linkMaxChars && link.length > linkMaxChars) {
            return `[${link.slice(0, linkMaxChars) + "..."}](${link})`;
        }

        return link;
    };

    const newText = text.replace(/(^| |\s)((?:https?:\/\/|ftps?:\/\/|\bwww\.))(\S+)($| |\s)/gim, (...args) => {
        console.log("args", args);
        const link = args[2] + args[3];
        return args[1] + getLinkStr(link) + args[4];
    });

    console.log("newText", newText);

    return newText;
};
