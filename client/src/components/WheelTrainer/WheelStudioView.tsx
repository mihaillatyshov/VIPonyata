import { useEffect, useEffectEvent, useState } from "react";

import { WheelTrainerStudio } from "./useWheelTrainerStudio";
import WheelCard from "./WheelCard";
import { formatDateTime, getThemeStyle, SpinHistoryEntry, StudioTab } from "./wheelTrainerModel";
import styles from "./WheelTrainerPage.module.css";

const HistoryPanel = ({ history }: { history: SpinHistoryEntry[] }) => (
    <aside className={styles.sidePanel}>
        <section className={styles.sideCard}>
            <div className={styles.sideCardTitle}>Последние результаты</div>
            {history.length === 0 ? (
                <p className={styles.sideCardEmpty}>После первого вращения здесь появится история.</p>
            ) : (
                <div className={styles.historyList}>
                    {history.map((entry) => (
                        <div key={entry.id} className={styles.historyItem}>
                            <div className={styles.historyItemTop}>
                                <strong>{formatDateTime(entry.startedAt)}</strong>
                                <span>{entry.results.length} результат(ов)</span>
                            </div>
                            <div className={styles.historyTags}>
                                {entry.results.map((result) => (
                                    <span
                                        key={`${entry.id}-${result.wheelId}-${result.option.id}`}
                                        className={styles.historyTag}
                                        style={getThemeStyle(result.themeKey)}
                                    >
                                        {result.wheelTitle}: {result.option.label}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    </aside>
);

/** Общие скорость и длительность для всех рулеток (вкладка «Кручение»). */
const SpinGlobalControls = ({ studio }: { studio: WheelTrainerStudio }) => {
    const referenceWheel = studio.activeWheel ?? studio.studio.wheels[0];
    const speed = referenceWheel?.speed ?? 6;
    const durationMs = referenceWheel?.durationMs ?? 5200;

    return (
        <div className={styles.spinGlobalControls}>
            <label className={styles.spinGlobalField}>
                <div className={styles.spinGlobalFieldTop}>
                    <span>Скорость</span>
                    <strong>{speed}</strong>
                </div>
                <input
                    type="range"
                    min="1"
                    max="10"
                    value={speed}
                    onChange={(event) =>
                        studio.dispatch({ type: "updateAllWheels", patch: { speed: Number(event.target.value) } })
                    }
                />
            </label>
            <label className={styles.spinGlobalField}>
                <div className={styles.spinGlobalFieldTop}>
                    <span>Длительность</span>
                    <strong>{(durationMs / 1000).toFixed(1)} c</strong>
                </div>
                <input
                    type="range"
                    min="2000"
                    max="12000"
                    step="500"
                    value={durationMs}
                    onChange={(event) =>
                        studio.dispatch({ type: "updateAllWheels", patch: { durationMs: Number(event.target.value) } })
                    }
                />
            </label>
        </div>
    );
};

/**
 * Студия: вкладка «Редактирование» (настройка рулеток, история, сохранение шаблона) и «Кручение».
 * Горячие клавиши: Space — активная рулетка, Shift+Space — все; в окне результата Enter — оставить, Space — удалить.
 */
const WheelStudioView = ({ studio }: { studio: WheelTrainerStudio }) => {
    const [studioTab, setStudioTab] = useState<StudioTab>("edit");
    const { wheels, activeWheelId, templateNameDraft, loadedTemplateId } = studio.studio;
    const isEditTab = studioTab === "edit";
    const isSpinTab = studioTab === "spin";
    const renderedWheels = isSpinTab ? wheels.filter((wheel) => wheel.options.length > 0) : wheels;

    const handleKeyDown = useEffectEvent((event: KeyboardEvent) => {
        const target = event.target as HTMLElement | null;
        const tagName = target?.tagName ?? "";
        const isTypingTarget =
            tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT" || target?.isContentEditable;

        if (event.key === "Enter" && studio.resultDialog !== null) {
            event.preventDefault();
            studio.closeResultDialog();
            return;
        }

        if (event.code === "Space" && studio.resultDialog !== null) {
            event.preventDefault();
            studio.applyResultRemoval();
            return;
        }

        if (isTypingTarget) {
            return;
        }

        if (event.code === "Space") {
            event.preventDefault();
            if (event.shiftKey) {
                studio.spinAllWheels();
            } else {
                studio.spinActiveWheel();
            }
        }
    });

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    return (
        <>
            <div className={styles.studioTabs}>
                <button
                    type="button"
                    className={`${styles.studioTabButton} ${isEditTab ? styles.studioTabButtonActive : ""}`}
                    onClick={() => setStudioTab("edit")}
                >
                    <i className="bi bi-sliders" aria-hidden="true"></i>
                    <span>Редактирование</span>
                </button>
                <button
                    type="button"
                    className={`${styles.studioTabButton} ${isSpinTab ? styles.studioTabButtonActive : ""}`}
                    onClick={() => setStudioTab("spin")}
                >
                    <i className="bi bi-disc" aria-hidden="true"></i>
                    <span>Кручение</span>
                </button>
            </div>

            <div className={styles.toolbar}>
                <div className={styles.toolbarMain}>{isSpinTab && <SpinGlobalControls studio={studio} />}</div>
                <div className={styles.toolbarMeta}></div>
            </div>

            {isSpinTab ? (
                <>
                    <div className={styles.spinActionBar}>
                        <button
                            type="button"
                            className={styles.spinAllAction}
                            onClick={studio.spinAllWheels}
                            disabled={wheels.some((wheel) => wheel.isSpinning)}
                        >
                            <i className="bi bi-stars" aria-hidden="true"></i>
                            <span>Крутить все</span>
                        </button>
                    </div>
                    <div className={styles.hotkeysPanel}>
                        <span>Shift+Space: все</span>
                        <span>Enter: закрыть результат</span>
                    </div>
                </>
            ) : (
                <div className={styles.hotkeysPanel}></div>
            )}

            <div className={`${styles.studioLayout} ${isSpinTab ? styles.studioLayoutSpin : ""}`}>
                <div className={`${styles.wheelsColumn} ${isSpinTab ? styles.wheelsColumnSpin : ""}`}>
                    {renderedWheels.map((wheel) => (
                        <WheelCard
                            key={wheel.id}
                            wheel={wheel}
                            isActive={activeWheelId === wheel.id}
                            isSpinTab={isSpinTab}
                            dispatch={studio.dispatch}
                            onAddAfter={() => studio.addWheelAfter(wheel.id)}
                            onRemove={() => studio.removeWheel(wheel.id)}
                            onSpin={() => studio.startSpin([wheel])}
                        />
                    ))}
                </div>

                {isEditTab && <HistoryPanel history={studio.history} />}
            </div>

            {isEditTab && (
                <div className={styles.editSaveBar}>
                    <label className={styles.templateNameField}>
                        <span>Название шаблона</span>
                        <input
                            value={templateNameDraft}
                            onChange={(event) => studio.dispatch({ type: "setTemplateName", name: event.target.value })}
                            placeholder="Например, 5-А / глаголы"
                        />
                    </label>
                    <button type="button" className={styles.primaryAction} onClick={studio.saveTemplate}>
                        <i className="bi bi-save" aria-hidden="true"></i>
                        <span>{loadedTemplateId ? "Обновить шаблон" : "Сохранить шаблон"}</span>
                    </button>
                </div>
            )}
        </>
    );
};

export default WheelStudioView;
