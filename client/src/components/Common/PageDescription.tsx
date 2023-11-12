import React from "react";

interface PageDescriptionProps {
    description?: string | null;
    className?: string;
    isCentered?: boolean;
}

const PageDescription = ({ description, className = "mb-5", isCentered }: PageDescriptionProps) => {
    if (isCentered) {
        className += " text-center";
    }

    console.log("description: ", description);

    return (
        <div className={`${className}`}>
            {description !== undefined ? (
                <div>{description}</div>
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
