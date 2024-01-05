import React from "react";

interface ProcessingButtonBlockProps {
    onDelete: () => void;
    extraClassName?: string;
}

export const ProcessingDelete = ({ onDelete, extraClassName = "" }: ProcessingButtonBlockProps) => {
    return (
        <input
            type="button"
            className={`btn btn-danger processing-page__button-delete ${extraClassName}`}
            value="Удалить"
            onClick={onDelete}
        />
    );
};
