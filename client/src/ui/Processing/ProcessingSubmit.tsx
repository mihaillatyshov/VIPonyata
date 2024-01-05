import React from "react";

interface ProcessingButtonSubmitProps {
    text: string;
    onSubmit: () => void;
    extraClassName?: string;
}

export const ProcessingSubmit = ({ text, onSubmit, extraClassName }: ProcessingButtonSubmitProps) => {
    return (
        <input
            type="button"
            className={`btn btn-success processing-page__button-success ${extraClassName}`}
            onClick={onSubmit}
            value={text}
        />
    );
};
