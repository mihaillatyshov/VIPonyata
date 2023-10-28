import React from "react";

interface PageDescriptionProps {
    description?: string | null;
    className?: string;
}

const PageDescription = ({ description, className = "mb-5" }: PageDescriptionProps) => {
    return (
        <div className={`${className}`}>
            {description !== undefined && description !== null ? (
                <div>{description}</div>
            ) : (
                <>
                    <div className="placeholder-wave w-100">
                        <span className="placeholder w-25 me-2 bg-placeholder rounded"></span>
                        <span className="placeholder w-25 me-2 bg-placeholder rounded"></span>
                        <span className="placeholder w-25 me-2 bg-placeholder rounded"></span>
                    </div>
                </>
            )}
        </div>
    );
};

export default PageDescription;
