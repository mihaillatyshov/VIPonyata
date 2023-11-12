import React from "react";

interface StudentLexisTaskTitleProps {
    title: string;
    extra?: string;
}

export const StudentLexisTaskTitle = ({ title, extra }: StudentLexisTaskTitleProps) => {
    return (
        <div className="mb-3 d-flex flex-column align-items-center">
            <div>{title}</div>
            <div>{extra}</div>
        </div>
    );
};
