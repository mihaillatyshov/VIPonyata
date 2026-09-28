import { useState } from "react";

interface ConfirmDeleteButtonProps {
    label: string;
    onConfirm: () => void;
    className?: string;
}

/** Кнопка удаления с подтверждением: «Удалить» → «Точно?» / «Отмена». */
const ConfirmDeleteButton = ({
    label,
    onConfirm,
    className = "btn quizlet-personal-topic-delete-action-btn",
}: ConfirmDeleteButtonProps) => {
    const [isConfirming, setIsConfirming] = useState(false);

    if (!isConfirming) {
        return (
            <button type="button" className={className} onClick={() => setIsConfirming(true)}>
                {label}
            </button>
        );
    }

    return (
        <>
            <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={() => {
                    setIsConfirming(false);
                    onConfirm();
                }}
            >
                Точно?
            </button>
            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setIsConfirming(false)}>
                Отмена
            </button>
        </>
    );
};

export default ConfirmDeleteButton;
