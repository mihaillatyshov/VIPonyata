import { Dispatch } from "react";

import { WheelStudioAction } from "./wheelStudioReducer";
import {
    getSegmentLabelStyle,
    getThemeStyle,
    getWheelGradient,
    THEME_KEYS,
    THEME_PRESETS,
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

const WheelBadges = ({ wheel, isActive }: { wheel: WheelTrainerWheel; isActive: boolean }) => (
    <div className={styles.wheelBadges}>
        {isActive && <span className={styles.badgeAccent}>Активная</span>}
        {wheel.isLocked && <span className={styles.badgeSoft}>Заблокирована</span>}
    </div>
);

/** Круг рулетки с подписями секторов; поворот анимируется CSS-переходом длительностью `durationMs`. */
const WheelDisc = ({ wheel, isSpinTab }: { wheel: WheelTrainerWheel; isSpinTab: boolean }) => {
    const angleSize = wheel.options.length > 0 ? 360 / wheel.options.length : 360;

    return (
        <div className={`${styles.wheelFrame} ${isSpinTab ? styles.wheelFrameSpin : ""}`}>
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

    return (
        <article
            className={`${styles.wheelCard} ${isActive ? styles.wheelCardActive : ""} ${isSpinTab ? styles.wheelCardSpin : ""}`}
            style={getThemeStyle(wheel.themeKey)}
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
                    <LockButton wheel={wheel} dispatch={dispatch} />
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
