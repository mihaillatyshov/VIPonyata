import { useRef, useState } from "react";

interface InlineEditableTitleProps {
    title: string;
    isEditing: boolean;
    onEditingChange: (isEditing: boolean) => void;
    /** Сохранить новое название (уже без пробелов по краям, отличается от текущего). */
    onRename: (title: string) => Promise<unknown> | void;
    editButtonTitle?: string;
    inputClassName?: string;
    placeholder?: string;
}

/**
 * Заголовок с карандашом: по клику превращается в поле ввода, Enter/потеря фокуса — сохранить, Escape — отменить.
 * Состояние «редактируется» контролирует родитель (от него, например, зависит активность элемента хлебных крошек).
 */
const InlineEditableTitle = ({
    title,
    isEditing,
    onEditingChange,
    onRename,
    editButtonTitle = "Переименовать",
    inputClassName = "quizlet-breadcrumb-inline-edit-input",
    placeholder,
}: InlineEditableTitleProps) => {
    const [draft, setDraft] = useState(title);
    const isCommittingRef = useRef(false);

    const startEditing = () => {
        setDraft(title);
        onEditingChange(true);
    };

    const cancel = () => {
        setDraft(title);
        onEditingChange(false);
    };

    const commit = async () => {
        const nextTitle = draft.trim();
        if (nextTitle.length === 0 || nextTitle === title) {
            cancel();
            return;
        }

        // Enter и последующий blur не должны отправить два запроса.
        if (isCommittingRef.current) {
            return;
        }

        isCommittingRef.current = true;
        try {
            await onRename(nextTitle);
            onEditingChange(false);
        } catch {
            // Оставляем поле открытым, чтобы можно было повторить.
        } finally {
            isCommittingRef.current = false;
        }
    };

    if (isEditing) {
        return (
            <input
                className={inputClassName}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={placeholder}
                autoFocus
                onBlur={commit}
                onKeyDown={(event) => {
                    if (event.key === "Enter") {
                        commit();
                    }
                    if (event.key === "Escape") {
                        cancel();
                    }
                }}
            />
        );
    }

    return (
        <span className="d-inline-flex align-items-center gap-2">
            <span>{title}</span>
            <button
                type="button"
                className="btn btn-sm btn-link p-0 text-muted quizlet-personal-topic-edit-btn"
                title={editButtonTitle}
                onClick={startEditing}
            >
                <i className="bi bi-pencil" />
            </button>
        </span>
    );
};

export default InlineEditableTitle;
