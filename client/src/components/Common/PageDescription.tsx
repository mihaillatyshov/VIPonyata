import React from "react";

import { TextWithLinks } from "./TextWithLinks";

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
                <TextWithLinks text={description ?? ""} linkMaxChars={60} />
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
