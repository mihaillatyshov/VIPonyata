import React from "react";

interface ProcessingSubmitButtonProps {
    text: string;
    onSubmit: () => void;
    extraClassName?: string;
}

export const ProcessingSubmitButton = ({ text, onSubmit, extraClassName }: ProcessingSubmitButtonProps) => {
    return (
        <input
            type="button"
            className={`btn btn-success processing-page__button-success ${extraClassName}`}
            onClick={onSubmit}
            value={text}
        />
    );
};
