import React from "react";

type TitleProps = { title: string };
export const Title = ({ title }: TitleProps) => {
    return <div> {title} </div>;
};

type DifficultyProps = { difficulty: string };
export const Difficulty = ({ difficulty }: DifficultyProps) => {
    return <div className="mb-2 text-muted"> {difficulty} </div>;
};

type DescriptionProps = { description: string | null };
export const Description = ({ description }: DescriptionProps) => {
    return <div> {description ?? ""} </div>;
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
