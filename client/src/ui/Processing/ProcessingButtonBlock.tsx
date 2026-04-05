import { useState } from "react";

import { TProcessingType } from "models/Processing";

import { ProcessingDeleteButton } from "./ProcessingDeleteButton";
import { ProcessingSubmitButton } from "./ProcessingSubmitButton";

interface ProcessingButtonBlockProps {
    onSubmit: () => void;
    onDelete: () => void;
    processingType: TProcessingType;
    requireDeleteConfirm?: boolean;
}

export const ProcessingButtonBlock = ({
    onSubmit,
    onDelete,
    processingType,
    requireDeleteConfirm = false,
}: ProcessingButtonBlockProps) => {
    const [isDeleteConfirming, setIsDeleteConfirming] = useState<boolean>(false);

    const handleDeleteClick = () => {
        if (!requireDeleteConfirm) {
            onDelete();
            return;
        }

        setIsDeleteConfirming(true);
    };

    const cancelDelete = () => {
        setIsDeleteConfirming(false);
    };

    const confirmDelete = () => {
        setIsDeleteConfirming(false);
        onDelete();
    };

    return (
        <div className="processing-page__button-block">
            <ProcessingSubmitButton text={processingType === "edit" ? "Сохранить" : "Создать"} onSubmit={onSubmit} />
            {processingType === "edit" &&
                (isDeleteConfirming ? (
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                        <button type="button" className="btn btn-danger" onClick={confirmDelete}>
                            Точно?
                        </button>
                        <button type="button" className="btn btn-secondary" onClick={cancelDelete}>
                            Отмена
                        </button>
                    </div>
                ) : (
                    <ProcessingDeleteButton onDelete={handleDeleteClick} />
                ))}
        </div>
    );
};
