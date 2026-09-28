import { CSSProperties, ReactNode, useState } from "react";

import { useOutsideClickDismiss } from "../shared/useOutsideClickDismiss";
import { isCardInteractiveTarget } from "./teacherQuizletUtils";

interface EditableCardItem {
    id: number;
    title: string;
}

interface OrderControlsProps {
    index: number;
    total: number;
    onMoveUp: () => void;
    onMoveDown: () => void;
}

const OrderControls = ({ index, total, onMoveUp, onMoveDown }: OrderControlsProps) => (
    <div className="d-flex flex-column align-items-center justify-content-center gap-1 flex-shrink-0">
        <button
            type="button"
            className="btn btn-sm btn-link p-0 text-muted"
            title="Поднять выше"
            onClick={onMoveUp}
            disabled={index === 0}
        >
            <i className="bi bi-arrow-up" />
        </button>
        <button
            type="button"
            className="btn btn-sm btn-link p-0 text-muted"
            title="Опустить ниже"
            onClick={onMoveDown}
            disabled={index === total - 1}
        >
            <i className="bi bi-arrow-down" />
        </button>
    </div>
);

const CONFIRM_WRAP_CLASS = "quizlet-topic-delete-confirm-wrap";

interface EditableCardGridProps<T extends EditableCardItem> {
    items: T[];
    createPlaceholder: string;
    createRowStyle?: CSSProperties;
    emptyText: string;
    isTitleBold?: boolean;
    renderMeta: (item: T) => ReactNode;
    onOpen: (item: T) => void;
    onCreate: (title: string) => Promise<unknown>;
    onRename: (item: T, title: string) => Promise<unknown>;
    onMove: (item: T, direction: -1 | 1) => void;
    onDelete: (item: T) => void;
}

/** Сетка карточек учителя (уроки или темы): создание, переименование, порядок, удаление с подтверждением. */
const EditableCardGrid = <T extends EditableCardItem>({
    items,
    createPlaceholder,
    createRowStyle,
    emptyText,
    isTitleBold = false,
    renderMeta,
    onOpen,
    onCreate,
    onRename,
    onMove,
    onDelete,
}: EditableCardGridProps<T>) => {
    const [newTitle, setNewTitle] = useState("");
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [titleDraft, setTitleDraft] = useState("");

    useOutsideClickDismiss(confirmDeleteId !== null, `.${CONFIRM_WRAP_CLASS}`, () => setConfirmDeleteId(null));

    const handleCreate = async () => {
        const title = newTitle.trim();
        if (title.length === 0) return;
        await onCreate(title);
        setNewTitle("");
    };

    const commitRename = async (item: T) => {
        const nextTitle = titleDraft.trim();
        if (nextTitle.length === 0 || nextTitle === item.title) {
            setTitleDraft(item.title);
            setEditingId(null);
            return;
        }
        await onRename(item, nextTitle);
        setEditingId(null);
    };

    const handleCardClick = (event: React.MouseEvent<HTMLDivElement>, item: T) => {
        if (editingId === item.id || isCardInteractiveTarget(event.target, event.currentTarget)) {
            return;
        }
        onOpen(item);
    };

    const handleCardKeyDown = (event: React.KeyboardEvent<HTMLDivElement>, item: T) => {
        if (editingId === item.id || isCardInteractiveTarget(event.target, event.currentTarget)) {
            return;
        }
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onOpen(item);
        }
    };

    return (
        <div className="quizlet-main-container">
            <div
                className="mb-3 d-flex gap-2 align-items-center quizlet-personal-topic-create-row"
                style={createRowStyle}
            >
                <input
                    className="form-control quizlet-personal-topic-create-input"
                    value={newTitle}
                    onChange={(event) => setNewTitle(event.target.value)}
                    placeholder={createPlaceholder}
                    onKeyDown={(event) => {
                        if (event.key === "Enter") {
                            handleCreate();
                        }
                    }}
                />
                <button className="btn btn-success btn-sm quizlet-personal-topic-create-btn" onClick={handleCreate}>
                    +
                </button>
            </div>

            {items.length === 0 && <p className="text-muted small mb-0">{emptyText}</p>}

            {items.length > 0 && (
                <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-2 pt-1">
                    {items.map((item, index) => (
                        <div className="col" key={item.id}>
                            <div
                                className="quizlet-topic-card-btn h-100"
                                role="button"
                                tabIndex={0}
                                onClick={(event) => handleCardClick(event, item)}
                                onKeyDown={(event) => handleCardKeyDown(event, item)}
                            >
                                <div className="card quizlet-topic-card h-100">
                                    <div className="card-body d-flex flex-column">
                                        <div className="quizlet-topic-card__header">
                                            <OrderControls
                                                index={index}
                                                total={items.length}
                                                onMoveUp={() => onMove(item, -1)}
                                                onMoveDown={() => onMove(item, 1)}
                                            />
                                            <div className="quizlet-topic-card__header-main">
                                                {editingId === item.id ? (
                                                    <input
                                                        className="form-control form-control-sm"
                                                        value={titleDraft}
                                                        onChange={(event) => setTitleDraft(event.target.value)}
                                                        autoFocus
                                                        onBlur={() => commitRename(item)}
                                                        onKeyDown={(event) => {
                                                            if (event.key === "Enter") {
                                                                commitRename(item);
                                                            }
                                                            if (event.key === "Escape") {
                                                                setTitleDraft(item.title);
                                                                setEditingId(null);
                                                            }
                                                        }}
                                                    />
                                                ) : (
                                                    <span
                                                        className={`quizlet-topic-card__title${isTitleBold ? " fw-semibold" : ""}`}
                                                    >
                                                        {item.title}
                                                    </span>
                                                )}
                                            </div>
                                            <div
                                                className={`d-flex gap-2 align-items-center flex-shrink-0 ${CONFIRM_WRAP_CLASS}`}
                                            >
                                                <button
                                                    className="btn btn-sm btn-link p-0 text-muted quizlet-personal-topic-edit-btn"
                                                    title="Переименовать"
                                                    onClick={() => {
                                                        setEditingId(item.id);
                                                        setTitleDraft(item.title);
                                                    }}
                                                >
                                                    <i className="bi bi-pencil" />
                                                </button>
                                                {confirmDeleteId === item.id ? (
                                                    <button
                                                        className="btn btn-sm btn-danger"
                                                        onClick={() => {
                                                            setConfirmDeleteId(null);
                                                            onDelete(item);
                                                        }}
                                                    >
                                                        Точно?
                                                    </button>
                                                ) : (
                                                    <button
                                                        className="btn btn-sm btn-link p-0 text-danger quizlet-personal-topic-row-delete-btn"
                                                        title="Удалить"
                                                        onClick={() => setConfirmDeleteId(item.id)}
                                                    >
                                                        ×
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <span className="quizlet-topic-card__count text-muted">{renderMeta(item)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default EditableCardGrid;
