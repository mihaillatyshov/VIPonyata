import React from "react";

import { ReactMarkdownWithHtml } from "components/Common/ReactMarkdownWithHtml";
import { ChatUrlLinkMd, TextWithLinksForMd } from "components/Common/TextWithLinks";

type TitleProps = { title: string };
export const Title = ({ title }: TitleProps) => {
    return <div className="course__card-title"> {title} </div>;
};

type DifficultyProps = { difficulty: string };
export const Difficulty = ({ difficulty }: DifficultyProps) => {
    return <div className="mb-2 text-muted"> Сложность: {difficulty} </div>;
};

type DescriptionProps = { description: string | null };
export const Description = ({ description }: DescriptionProps) => {
    return (
        <div className="md-last-pad-zero">
            <ReactMarkdownWithHtml components={{ a: ChatUrlLinkMd }}>
                {TextWithLinksForMd({ text: description ?? "", linkMaxChars: 60 })}
            </ReactMarkdownWithHtml>
        </div>
    );
};

export const TitlePlaceholder = () => {
    return (
        <div className="placeholder-wave ">
            <span className="placeholder w-75 bg-placeholder rounded"></span>
        </div>
    );
};

export const DifficultyPlaceholder = () => {
    return (
        <div className="placeholder-wave">
            <span className="placeholder w-25 bg-light rounded"></span>
        </div>
    );
};

export const DescriptionPlaceholder = () => {
    return (
        <div className="placeholder-wave">
            <span className="placeholder w-50 bg-placeholder me-3 rounded"></span>
            <span className="placeholder w-25 bg-placeholder rounded"></span>

            <span className="placeholder w-25 bg-placeholder me-3 rounded"></span>
            <span className="placeholder w-25 bg-placeholder me-3 rounded"></span>
            <span className="placeholder w-25 bg-placeholder me-3 rounded"></span>

            <span className="placeholder w-25 bg-placeholder me-3 rounded"></span>
            <span className="placeholder w-50 bg-placeholder rounded"></span>
        </div>
    );
};
