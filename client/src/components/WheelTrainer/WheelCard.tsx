import { Dispatch, HTMLAttributes, useLayoutEffect, useRef, useState } from "react";

import { useSortable } from "@dnd-kit/sortable";
import { CSS as DNDCSS } from "@dnd-kit/utilities";

import { WheelStudioAction } from "./wheelStudioReducer";
import {
    getSegmentLabelStyle,
    getThemeStyle,
    getWheelGradient,
    THEME_KEYS,
    THEME_PRESETS,
    WHEEL_STAGE_HEIGHT,
    WHEEL_STAGE_WIDTH,
    WheelTrainerWheel,
} from "./wheelTrainerModel";
import styles from "./WheelTrainerPage.module.css";

const LockButton = ({ wheel, dispatch }: { wheel: WheelTrainerWheel; dispatch: Dispatch<WheelStudioAction> }) => (
    <button
        type="button"
        className={styles.iconButton}
        aria-label={wheel.isLocked ? "Разблокировать" : "Заблокировать"}
        onClick={(event) => {
            event.stopPropagation();
            dispatch({ type: "updateWheel", wheelId: wheel.id, patch: { isLocked: !wheel.isLocked } });
        }}
    >
        <i className={`bi ${wheel.isLocked ? "bi-lock-fill" : "bi-unlock"}`} aria-hidden="true"></i>
    </button>
);

/** Ручка перетаскивания: карточку двигают только за неё, чтобы не мешать кликам, полям ввода и кручению. */
const DragHandle = ({
    handleRef,
    handleProps,
}: {
    handleRef: (element: HTMLElement | null) => void;
    handleProps: HTMLAttributes<HTMLButtonElement>;
}) => (
    <button
        ref={handleRef}
        type="button"
        className={`${styles.iconButton} ${styles.dragHandle}`}
        data-wheel-drag-handle
        aria-label="Перетащить рулетку"
        title="Перетащите, чтобы изменить порядок"
        onClick={(event) => event.stopPropagation()}
        {...handleProps}
    >
        <i className="bi bi-grip-vertical" aria-hidden="true"></i>
    </button>
);

const WheelBadges = ({ wheel, isActive }: { wheel: WheelTrainerWheel; isActive: boolean }) => (
    <div className={styles.wheelBadges}>
        {isActive && <span className={styles.badgeAccent}>Активная</span>}
        {wheel.isLocked && <span className={styles.badgeSoft}>Заблокирована</span>}
        {wheel.alwaysKeep && <span className={styles.badgeSoft}>Всегда оставлять</span>}
    </div>
);

/**
 * Масштаб сцены «диск + стрелка» под ширину рамки. На вкладке «Кручение» рулетка растягивается на всю ширину
 * карточки, на «Редактировании» только уменьшается, если не помещается.
 */
const useStageScale = (isSpinTab: boolean) => {
    const frameRef = useRef<HTMLDivElement>(null);
    const [frameWidth, setFrameWidth] = useState<number | null>(null);

    useLayoutEffect(() => {
        const frame = frameRef.current;
        if (frame === null) {
            return;
        }

        setFrameWidth(frame.clientWidth - parseFloat(getComputedStyle(frame).paddingLeft) * 2);
        const observer = new ResizeObserver(([entry]) => setFrameWidth(entry.contentRect.width));
        observer.observe(frame);
        return () => observer.disconnect();
    }, []);

    if (frameWidth === null || frameWidth <= 0) {
        return { frameRef, scale: 1 };
    }

    const fitScale = frameWidth / WHEEL_STAGE_WIDTH;
    return { frameRef, scale: isSpinTab ? fitScale : Math.min(fitScale, 1) };
};

/** Круг рулетки с подписями секторов; поворот анимируется CSS-переходом длительностью `durationMs`. */
const WheelDisc = ({ wheel, isSpinTab }: { wheel: WheelTrainerWheel; isSpinTab: boolean }) => {
    const angleSize = wheel.options.length > 0 ? 360 / wheel.options.length : 360;
    const { frameRef, scale } = useStageScale(isSpinTab);

    return (
        <div
            ref={frameRef}
            className={`${styles.wheelFrame} ${isSpinTab ? styles.wheelFrameSpin : ""}`}
            style={isSpinTab ? { height: `${WHEEL_STAGE_HEIGHT * scale}px` } : undefined}
        >
            <div className={styles.wheelStage} style={{ transform: `translate(-50%, -50%) scale(${scale})` }}>
                <div className={`${styles.wheelPointer} ${styles.wheelPointerRight}`}>
                    <i className="bi bi-caret-left-fill" aria-hidden="true"></i>
                </div>
                <div
                    className={styles.wheelDisc}
                    style={{
                        background: getWheelGradient(wheel),
                        transform: `rotate(${wheel.rotation}deg)`,
                        transitionDuration: `${wheel.durationMs}ms`,
                    }}
                >
                    {wheel.options.length === 0 ? (
                        <div className={styles.wheelEmptyState}>Добавьте варианты</div>
                    ) : (
                        wheel.options.map((option, index) => (
                            <div
                                key={option.id}
                                className={styles.segmentLabel}
                                style={getSegmentLabelStyle(
                                    option.label,
                                    index * angleSize + angleSize / 2,
                                    wheel.options.length,
                                )}
                            >
                                <span>{option.label}</span>
                            </div>
                        ))
                    )}
                    <div className={styles.wheelCenterCap}>
                        <span>{wheel.options.length}</span>
                        <small>вариантов</small>
                    </div>
                </div>
            </div>
        </div>
    );
};

/** Настройки рулетки на вкладке «Редактирование»: скорость, длительность, тема, варианты. */
const WheelConfig = ({ wheel, dispatch }: { wheel: WheelTrainerWheel; dispatch: Dispatch<WheelStudioAction> }) => (
    <div className={styles.wheelConfigBlock} onClick={(event) => event.stopPropagation()}>
        <div className={styles.configGrid}>
            <label className={styles.configField}>
                <span>Скорость</span>
                <input
                    type="range"
                    min="1"
                    max="10"
                    value={wheel.speed}
                    onChange={(event) =>
                        dispatch({
                            type: "updateWheel",
                            wheelId: wheel.id,
                            patch: { speed: Number(event.target.value) },
                        })
                    }
                />
                <strong>{wheel.speed}</strong>
            </label>

            <label className={styles.configField}>
                <span>Длительность</span>
                <input
                    type="range"
                    min="2000"
                    max="12000"
                    step="500"
                    value={wheel.durationMs}
                    onChange={(event) =>
                        dispatch({
                            type: "updateWheel",
                            wheelId: wheel.id,
                            patch: { durationMs: Number(event.target.value) },
                        })
                    }
                />
                <strong>{(wheel.durationMs / 1000).toFixed(1)} c</strong>
            </label>
        </div>

        <label className={styles.alwaysKeepField}>
            <input
                type="checkbox"
                checked={wheel.alwaysKeep}
                onChange={(event) =>
                    dispatch({ type: "updateWheel", wheelId: wheel.id, patch: { alwaysKeep: event.target.checked } })
                }
            />
            <span>Всегда оставлять</span>
            <small>Выпавший вариант не удаляется из этой рулетки, даже если в окне результата нажать «Удалить».</small>
        </label>

        <div className={styles.themeStrip}>
            {THEME_KEYS.map((themeKey) => (
                <button
                    key={themeKey}
                    type="button"
                    className={`${styles.themeSwatch} ${wheel.themeKey === themeKey ? styles.themeSwatchActive : ""}`}
                    style={{
                        background: `linear-gradient(135deg, ${THEME_PRESETS[themeKey].colors.slice(0, 3).join(", ")})`,
                    }}
                    title={THEME_PRESETS[themeKey].label}
                    onClick={() => dispatch({ type: "updateWheel", wheelId: wheel.id, patch: { themeKey } })}
                >
                    <span>{THEME_PRESETS[themeKey].label}</span>
                </button>
            ))}
        </div>

        <label className={styles.optionTextEditor}>
            <span>Варианты для рулетки</span>
            <textarea
                value={wheel.optionsEditorText}
                placeholder="Один вариант на строку"
                onChange={(event) => dispatch({ type: "setOptionsText", wheelId: wheel.id, text: event.target.value })}
            />
            <small>Один Enter = новый вариант. Можно сразу вставить столбец из Excel или любой список строк.</small>
        </label>
    </div>
);

interface WheelCardProps {
    wheel: WheelTrainerWheel;
    isActive: boolean;
    isSpinTab: boolean;
    dispatch: Dispatch<WheelStudioAction>;
    onAddAfter: () => void;
    onRemove: () => void;
    onSpin: () => void;
}

const WheelCard = ({ wheel, isActive, isSpinTab, dispatch, onAddAfter, onRemove, onSpin }: WheelCardProps) => {
    const isEditTab = !isSpinTab;
    const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
        id: wheel.id,
    });
    const dragHandle = <DragHandle handleRef={setActivatorNodeRef} handleProps={{ ...attributes, ...listeners }} />;

    return (
        <article
            ref={setNodeRef}
            className={`${styles.wheelCard} ${isActive ? styles.wheelCardActive : ""} ${isSpinTab ? styles.wheelCardSpin : ""} ${isDragging ? styles.wheelCardDragging : ""}`}
            style={{
                ...getThemeStyle(wheel.themeKey),
                transform: DNDCSS.Translate.toString(transform),
                transition,
            }}
            onClick={() => dispatch({ type: "setActiveWheel", wheelId: wheel.id })}
        >
            {isEditTab && (
                <div className={styles.wheelCardHeader}>
                    <div className={styles.wheelTitleGroup}>
                        <input
                            className={styles.wheelTitleInput}
                            value={wheel.title}
                            onChange={(event) =>
                                dispatch({
                                    type: "updateWheel",
                                    wheelId: wheel.id,
                                    patch: { title: event.target.value },
                                })
                            }
                            onClick={(event) => event.stopPropagation()}
                        />
                        <WheelBadges wheel={wheel} isActive={isActive} />
                    </div>
                    <div className={styles.wheelHeaderActions}>
                        {dragHandle}
                        <button
                            type="button"
                            className={styles.wheelAddButton}
                            aria-label="Добавить рулетку ниже"
                            onClick={(event) => {
                                event.stopPropagation();
                                onAddAfter();
                            }}
                        >
                            <i className="bi bi-plus-lg" aria-hidden="true"></i>
                        </button>
                        <LockButton wheel={wheel} dispatch={dispatch} />
                        <button
                            type="button"
                            className={styles.iconButton}
                            aria-label="Удалить рулетку"
                            onClick={(event) => {
                                event.stopPropagation();
                                onRemove();
                            }}
                        >
                            <i className="bi bi-x-lg" aria-hidden="true"></i>
                        </button>
                    </div>
                </div>
            )}

            {isSpinTab && (
                <div className={styles.wheelSpinHeader}>
                    <WheelBadges wheel={wheel} isActive={isActive} />
                    <div className={styles.wheelHeaderActions}>
                        {dragHandle}
                        <LockButton wheel={wheel} dispatch={dispatch} />
                    </div>
                </div>
            )}

            <div className={`${styles.wheelCardBody} ${isSpinTab ? styles.wheelCardBodySpin : ""}`}>
                <div
                    className={`${styles.wheelVisualBlock} ${isSpinTab ? styles.wheelVisualBlockSpin : ""}`}
                    onClick={
                        isSpinTab
                            ? (event) => {
                                  event.stopPropagation();
                                  dispatch({ type: "setActiveWheel", wheelId: wheel.id });
                                  if (!wheel.isSpinning && wheel.options.length > 0) {
                                      onSpin();
                                  }
                              }
                            : undefined
                    }
                >
                    <WheelDisc wheel={wheel} isSpinTab={isSpinTab} />
                    {isEditTab && <div className={styles.wheelFooterBar}></div>}
                </div>

                {isEditTab && <WheelConfig wheel={wheel} dispatch={dispatch} />}
            </div>
        </article>
    );
};

export default WheelCard;
