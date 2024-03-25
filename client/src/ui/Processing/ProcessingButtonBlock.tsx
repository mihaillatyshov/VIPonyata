import React from "react";

import { TProcessingType } from "models/Processing";

import { ProcessingDeleteButton } from "./ProcessingDeleteButton";
import { ProcessingSubmitButton } from "./ProcessingSubmitButton";

interface ProcessingButtonBlockProps {
    onSubmit: () => void;
    onDelete: () => void;
    processingType: TProcessingType;
}

export const ProcessingButtonBlock = ({ onSubmit, onDelete, processingType }: ProcessingButtonBlockProps) => {
    return (
        <div className="processing-page__button-block">
            <ProcessingSubmitButton text={processingType === "edit" ? "Сохранить" : "Создать"} onSubmit={onSubmit} />
            {processingType === "edit" && <ProcessingDeleteButton onDelete={onDelete} />}
        </div>
    );
};
