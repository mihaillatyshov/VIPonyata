import React from "react";

import { TProcessingType } from "models/Processing";

import { ProcessingDelete } from "./ProcessingDelete";
import { ProcessingSubmit } from "./ProcessingSubmit";

interface ProcessingButtonBlockProps {
    onSubmit: () => void;
    onDelete: () => void;
    processingType: TProcessingType;
}

export const ProcessingButtonBlock = ({ onSubmit, onDelete, processingType }: ProcessingButtonBlockProps) => {
    return (
        <div className="processing-page__button-block">
            <ProcessingSubmit text={processingType === "edit" ? "Сохранить" : "Создать"} onSubmit={onSubmit} />
            {processingType === "edit" && <ProcessingDelete onDelete={onDelete} />}
        </div>
    );
};
