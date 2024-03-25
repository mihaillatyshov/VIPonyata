import React from "react";

interface ProcessingDeleteButtonProps {
    onDelete: () => void;
    extraClassName?: string;
}

export const ProcessingDeleteButton = ({ onDelete, extraClassName = "" }: ProcessingDeleteButtonProps) => {
    return (
        <input
            type="button"
            className={`btn btn-danger processing-page__button-delete ${extraClassName}`}
            value="Удалить"
            onClick={onDelete}
        />
    );
};
