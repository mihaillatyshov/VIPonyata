import { useMemo } from "react";
import { Modal } from "react-bootstrap";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useWheelTrainerStudio, WheelTrainerStudio } from "./useWheelTrainerStudio";
import WheelStudioView from "./WheelStudioView";
import {
    formatDateTime,
    getThemeStyle,
    WHEEL_TRAINER_ROUTE_STUDIO,
    WHEEL_TRAINER_ROUTE_TEMPLATES,
    WheelTrainerTemplate,
} from "./wheelTrainerModel";
import styles from "./WheelTrainerPage.module.css";

const WheelHub = ({ templatesCount, onStartFresh }: { templatesCount: number; onStartFresh: () => void }) => (
    <div className={styles.hubGrid}>
        <button type="button" className={styles.hubCard} onClick={onStartFresh}>
            <div className={styles.hubCardGlow}></div>
            <div className={styles.hubCardIcon}>
                <i className="bi bi-disc"></i>
            </div>
            <h2>Создать новую рулетку</h2>
            <p>Откройте studio-режим, соберите несколько колес и запустите урок с горячих клавиш.</p>
            <span className={styles.hubCardHint}>Space: активная | Shift+Space: все сразу</span>
        </button>

        <Link className={styles.hubCard} to={WHEEL_TRAINER_ROUTE_TEMPLATES}>
            <div className={styles.hubCardGlow}></div>
            <div className={styles.hubCardIcon}>
                <i className="bi bi-folder2-open"></i>
            </div>
            <h2>Сохраненные шаблоны</h2>
            <p>Загрузите набор рулеток в один клик и начните урок без ручной подготовки.</p>
            <span className={styles.hubCardHint}>Сохранено: {templatesCount}</span>
        </Link>
    </div>
);

interface WheelTemplatesListProps {
    templates: WheelTrainerTemplate[];
    onOpen: (template: WheelTrainerTemplate) => void;
    onDelete: (templateId: string) => void;
    onStartFresh: () => void;
}

const WheelTemplatesList = ({ templates, onOpen, onDelete, onStartFresh }: WheelTemplatesListProps) => {
    const sortedTemplates = useMemo(
        () => [...templates].sort((first, second) => second.updatedAt.localeCompare(first.updatedAt)),
        [templates],
    );

    return (
        <div className={styles.templatesGrid}>
            {sortedTemplates.length === 0 ? (
                <div className={styles.emptyState}>
                    <i className="bi bi-folder-x"></i>
                    <h2>Шаблонов пока нет</h2>
                    <p>Сохраните первую сессию Wheel Trainer, чтобы запускать наборы рулеток одним кликом.</p>
                    <button type="button" className={styles.primaryAction} onClick={onStartFresh}>
                        Создать первую рулетку
                    </button>
                </div>
            ) : (
                sortedTemplates.map((template) => (
                    <article key={template.id} className={styles.templateCard}>
                        <div className={styles.templateCardTop}>
                            <div>
                                <h2>{template.name}</h2>
                                <p>
                                    {template.wheels.length} рулеток • обновлен {formatDateTime(template.updatedAt)}
                                </p>
                            </div>
                            <button
                                type="button"
                                className={styles.iconButton}
                                aria-label="Удалить шаблон"
                                onClick={() => onDelete(template.id)}
                            >
                                <i className="bi bi-trash3" aria-hidden="true"></i>
                            </button>
                        </div>

                        <div className={styles.templatePreviewRow}>
                            {template.wheels.map((wheel) => (
                                <div
                                    key={wheel.id}
                                    className={styles.templatePreviewChip}
                                    style={getThemeStyle(wheel.themeKey)}
                                >
                                    <span>{wheel.title}</span>
                                    <strong>{wheel.options.length}</strong>
                                </div>
                            ))}
                        </div>

                        <button type="button" className={styles.primaryAction} onClick={() => onOpen(template)}>
                            <i className="bi bi-lightning-charge" aria-hidden="true"></i>
                            <span>Загрузить шаблон</span>
                        </button>
                    </article>
                ))
            )}
        </div>
    );
};

const WheelResultModal = ({ studio }: { studio: WheelTrainerStudio }) => {
    const { resultDialog } = studio;
    const isSingle = resultDialog?.results.length === 1;
    const themeKey = resultDialog?.results[0]?.themeKey ?? studio.activeWheel?.themeKey ?? "pink";

    return (
        <Modal
            show={resultDialog !== null}
            onHide={studio.closeResultDialog}
            centered
            size="lg"
            contentClassName="modal-content-auto-height"
        >
            <div className={styles.resultModal} style={getThemeStyle(themeKey)}>
                <Modal.Header closeButton className={styles.resultModalHeader}>
                    <div className={styles.resultHero}>
                        <div className={styles.resultHeroBadge}>
                            <i className="bi bi-stars" aria-hidden="true"></i>
                            <span>{isSingle ? "Финальный выбор" : "Финальные выборы"}</span>
                        </div>
                        <Modal.Title>{isSingle ? "Результат рулетки" : "Результаты рулеток 🤩"}</Modal.Title>
                    </div>
                </Modal.Header>
                <Modal.Body className={styles.resultModalBody}>
                    <div className={styles.resultList}>
                        {resultDialog?.results.map((result) => (
                            <div
                                key={`${result.wheelId}-${result.option.id}`}
                                className={styles.resultCard}
                                style={getThemeStyle(result.themeKey)}
                            >
                                <div className={styles.resultCardGlow}></div>
                                <div className={styles.resultWheelName}>{result.wheelTitle}</div>
                                <div className={styles.resultValue}>{result.option.label}</div>
                            </div>
                        ))}
                    </div>
                </Modal.Body>
                <Modal.Footer className={styles.resultModalFooter}>
                    <button
                        type="button"
                        className={`${styles.secondaryAction} ${styles.resultActionSecondary}`}
                        onClick={studio.closeResultDialog}
                    >
                        Оставить
                    </button>
                    <button
                        type="button"
                        className={`${styles.primaryAction} ${styles.resultActionPrimary}`}
                        onClick={studio.applyResultRemoval}
                    >
                        Удалить
                    </button>
                </Modal.Footer>
            </div>
        </Modal>
    );
};

const WheelTrainerPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const studio = useWheelTrainerStudio();

    const isStudioView = location.pathname === WHEEL_TRAINER_ROUTE_STUDIO;
    const isTemplatesView = location.pathname === WHEEL_TRAINER_ROUTE_TEMPLATES;

    const openStudio = (template: WheelTrainerTemplate | null) => {
        studio.startNewSession(template);
        navigate(WHEEL_TRAINER_ROUTE_STUDIO);
    };

    return (
        <div className={styles.page}>
            <div className={styles.pageInner}>
                <div className={styles.pageHeader}>
                    <div>
                        <h1 className={styles.pageTitle}>Wheel Trainer</h1>
                    </div>
                    <div className={styles.headerActions}>
                        {!isStudioView && (
                            <button type="button" className={styles.primaryAction} onClick={() => openStudio(null)}>
                                <i className="bi bi-plus-circle" aria-hidden="true"></i>
                                <span>Новая рулетка</span>
                            </button>
                        )}
                    </div>
                </div>

                {studio.banner && (
                    <div className={styles.banner} role="status">
                        <i className="bi bi-stars" aria-hidden="true"></i>
                        <span>{studio.banner}</span>
                    </div>
                )}

                {!isStudioView && !isTemplatesView && (
                    <WheelHub templatesCount={studio.templates.length} onStartFresh={() => openStudio(null)} />
                )}

                {isTemplatesView && (
                    <WheelTemplatesList
                        templates={studio.templates}
                        onOpen={openStudio}
                        onDelete={studio.deleteTemplate}
                        onStartFresh={() => openStudio(null)}
                    />
                )}

                {isStudioView && <WheelStudioView studio={studio} />}
            </div>

            <WheelResultModal studio={studio} />
        </div>
    );
};

export default WheelTrainerPage;
