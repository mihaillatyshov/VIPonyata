import React from "react";
import ReactMarkdown from "react-markdown";

import { ChatUrlLinkMd, TextWithLinksForMd } from "./TextWithLinks";

interface PageDescriptionProps {
    description?: string | null;
    className?: string;
    isCentered?: boolean;
}

const PageDescription = ({ description, className = "mb-5", isCentered }: PageDescriptionProps) => {
    if (isCentered) {
        className += " text-center";
    }

    return (
        <div className={`${className}`}>
            {description !== undefined ? (
                <div className="text-center md-last-pad-zero">
                    <ReactMarkdown components={{ a: ChatUrlLinkMd }}>
                        {TextWithLinksForMd({ text: description ?? "", linkMaxChars: 60 })}
                    </ReactMarkdown>
                </div>
            ) : (
                <div className="placeholder-wave w-100">
                    <span className="placeholder w-25 me-2 bg-placeholder rounded"></span>
                    <span className="placeholder w-25 me-2 bg-placeholder rounded"></span>
                    <span className="placeholder w-25 me-2 bg-placeholder rounded"></span>
                </div>
            )}
        </div>
    );
};

export default PageDescription;
