import { CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { Modal } from "react-bootstrap";
import { Link, useLocation, useNavigate } from "react-router-dom";

import styles from "./WheelTrainerPage.module.css";

type WheelThemeKey = "pink" | "yellow" | "blue" | "redWine" | "green" | "brown" | "forest" | "summer";

interface WheelTrainerOption {
    id: string;
    label: string;
}

interface WheelTrainerWheel {
    id: string;
    title: string;
    themeKey: WheelThemeKey;
    options: WheelTrainerOption[];
    optionsEditorText: string;
    isLocked: boolean;
    speed: number;
    durationMs: number;
    rotation: number;
    isSpinning: boolean;
    lastResultOptionId: string | null;
}

interface WheelTrainerTemplate {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    wheels: WheelTrainerWheel[];
}

interface SpinResultItem {
    wheelId: string;
    wheelTitle: string;
    option: WheelTrainerOption;
    themeKey: WheelThemeKey;
}

interface ResultDialogState {
    results: SpinResultItem[];
    startedAt: string;
}

type StudioTab = "edit" | "spin";

interface SpinHistoryEntry {
    id: string;
    startedAt: string;
    results: SpinResultItem[];
}

interface RemovedOptionEntry {
    wheelId: string;
    wheelTitle: string;
    option: WheelTrainerOption;
    insertIndex: number;
}

interface RemovedOptionAction {
    id: string;
    removedAt: string;
    entries: RemovedOptionEntry[];
}

interface ThemePreset {
    label: string;
    colors: string[];
    textColor: string;
    canvasTextColor: string;
}

const WHEEL_TRAINER_TEMPLATE_STORAGE_KEY = "wheel-trainer-templates-v1";
const WHEEL_TRAINER_DRAFT_STORAGE_KEY = "wheel-trainer-draft-v1";
const WHEEL_TRAINER_ROUTE_ROOT = "/teacher/wheel-trainer";
const WHEEL_TRAINER_ROUTE_STUDIO = "/teacher/wheel-trainer/new";
const WHEEL_TRAINER_ROUTE_TEMPLATES = "/teacher/wheel-trainer/templates";
const MAX_HISTORY_ENTRIES = 12;

const THEME_PRESETS: Record<WheelThemeKey, ThemePreset> = {
    pink: {
        label: "Pink",
        colors: ["#FF4D81", "#FFC3CF", "#FFE0E4", "#FF81A5", "#FFB8CF"],
        textColor: "#4a1024",
        canvasTextColor: "#4a1024",
    },
    yellow: {
        label: "Yellow",
        colors: ["#502503", "#773D03", "#D6A10E", "#FBDA4B", "#FAE36F"],
        textColor: "#2f1a03",
        canvasTextColor: "#2f1a03",
    },
    blue: {
        label: "Blue",
        colors: ["#044B66", "#09799E", "#021F2E", "#47A9CF", "#A6E0F4"],
        textColor: "#eaf8ff",
        canvasTextColor: "#ffffff",
    },
    redWine: {
        label: "Red Wine",
        colors: ["#020101", "#3D0B0D", "#53080E", "#72090F", "#930510", "#B21F29"],
        textColor: "#fff1f3",
        canvasTextColor: "#ffffff",
    },
    green: {
        label: "Green",
        colors: ["#314B0D", "#1B2109", "#537317", "#57603E", "#7B924F", "#3E3726", "#B6C598"],
        textColor: "#f2f8e8",
        canvasTextColor: "#ffffff",
    },
    brown: {
        label: "Brown",
        colors: ["#19130F", "#36261A", "#553E28", "#735B3E", "#927C5D", "#BBA47F", "#D1D1B7"],
        textColor: "#fff8ef",
        canvasTextColor: "#ffffff",
    },
    forest: {
        label: "Forest",
        colors: ["#1B1C10", "#393734", "#CCCCCD", "#A8A8A9", "#5D5B5A", "#838282", "#3D4B0C"],
        textColor: "#f3f4ef",
        canvasTextColor: "#ffffff",
    },
    summer: {
        label: "Summer",
        colors: ["#E6FFF8", "#F390A3", "#91C51A", "#3B7200", "#011901"],
        textColor: "#102815",
        canvasTextColor: "#102815",
    },
};

const THEME_KEYS = Object.keys(THEME_PRESETS) as WheelThemeKey[];

const isRecord = (value: unknown): value is Record<string, unknown> => {
    return typeof value === "object" && value !== null;
};

const clampNumber = (value: number, min: number, max: number) => {
    return Math.min(Math.max(value, min), max);
};

const createId = (prefix: string) => {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
};

const createDefaultOptions = () => {
    return Array.from({ length: 6 }, (_, index) => ({
        id: createId("option"),
        label: `Вариант ${index + 1}`,
    }));
};

const createWheel = (index: number): WheelTrainerWheel => {
    const options = createDefaultOptions();

    return {
        id: createId("wheel"),
        title: `Рулетка ${index}`,
        themeKey: THEME_KEYS[(index - 1) % THEME_KEYS.length],
        options,
        optionsEditorText: formatOptionsText(options),
        isLocked: false,
        speed: 6,
        durationMs: 5200,
        rotation: 0,
        isSpinning: false,
        lastResultOptionId: null,
    };
};

const cloneWheelForStorage = (wheel: WheelTrainerWheel): WheelTrainerWheel => {
    return {
        ...wheel,
        rotation: wheel.rotation,
        isSpinning: false,
        lastResultOptionId: wheel.lastResultOptionId,
        optionsEditorText: wheel.optionsEditorText,
        options: wheel.options.map((option) => ({ ...option })),
    };
};

const sanitizeOption = (value: unknown): WheelTrainerOption | null => {
    if (!isRecord(value) || typeof value.label !== "string") {
        return null;
    }

    const label = value.label.trim();
    if (!label) {
        return null;
    }

    return {
        id: typeof value.id === "string" && value.id ? value.id : createId("option"),
        label,
    };
};

const sanitizeWheel = (value: unknown, index: number): WheelTrainerWheel => {
    const fallback = createWheel(index + 1);

    if (!isRecord(value)) {
        return fallback;
    }

    const options = Array.isArray(value.options)
        ? value.options.map((item) => sanitizeOption(item)).filter((item): item is WheelTrainerOption => item !== null)
        : [];

    return {
        ...fallback,
        id: typeof value.id === "string" && value.id ? value.id : fallback.id,
        title: typeof value.title === "string" && value.title.trim() ? value.title.trim() : fallback.title,
        themeKey:
            typeof value.themeKey === "string" && value.themeKey in THEME_PRESETS
                ? (value.themeKey as WheelThemeKey)
                : fallback.themeKey,
        options: options.length > 0 ? options : fallback.options,
        isLocked: Boolean(value.isLocked),
        speed: typeof value.speed === "number" ? clampNumber(value.speed, 1, 10) : fallback.speed,
        durationMs:
            typeof value.durationMs === "number" ? clampNumber(value.durationMs, 2000, 12000) : fallback.durationMs,
        rotation: typeof value.rotation === "number" ? value.rotation : fallback.rotation,
        isSpinning: false,
        lastResultOptionId: typeof value.lastResultOptionId === "string" ? value.lastResultOptionId : null,
        optionsEditorText:
            typeof value.optionsEditorText === "string"
                ? value.optionsEditorText
                : formatOptionsText(options.length > 0 ? options : fallback.options),
    };
};

const sanitizeTemplate = (value: unknown, index: number): WheelTrainerTemplate | null => {
    if (!isRecord(value) || !Array.isArray(value.wheels)) {
        return null;
    }

    const wheels = value.wheels.map((wheel, wheelIndex) => sanitizeWheel(wheel, wheelIndex));
    if (wheels.length === 0) {
        return null;
    }

    return {
        id: typeof value.id === "string" && value.id ? value.id : createId(`template-${index}`),
        name: typeof value.name === "string" && value.name.trim() ? value.name.trim() : `Шаблон ${index + 1}`,
        createdAt: typeof value.createdAt === "string" ? value.createdAt : new Date().toISOString(),
        updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : new Date().toISOString(),
        wheels,
    };
};

const readTemplatesFromStorage = () => {
    try {
        const rawValue = window.localStorage.getItem(WHEEL_TRAINER_TEMPLATE_STORAGE_KEY);
        if (rawValue === null) {
            return [] as WheelTrainerTemplate[];
        }

        const parsedValue = JSON.parse(rawValue);
        if (!Array.isArray(parsedValue)) {
            return [] as WheelTrainerTemplate[];
        }

        return parsedValue
            .map((item, index) => sanitizeTemplate(item, index))
            .filter(Boolean) as WheelTrainerTemplate[];
    } catch {
        return [] as WheelTrainerTemplate[];
    }
};

const formatDateTime = (value: string) => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return value;
    }

    return parsed.toLocaleString("ru-RU", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const getThemeStyle = (themeKey: WheelThemeKey): CSSProperties => {
    const palette = THEME_PRESETS[themeKey];

    return {
        "--wheel-color-1": palette.colors[0],
        "--wheel-color-2": palette.colors[1] ?? palette.colors[0],
        "--wheel-color-3": palette.colors[2] ?? palette.colors[0],
        "--wheel-color-4": palette.colors[3] ?? palette.colors[1] ?? palette.colors[0],
        "--wheel-color-5": palette.colors[4] ?? palette.colors[0],
        "--wheel-color-6": palette.colors[5] ?? palette.colors[1] ?? palette.colors[0],
        "--wheel-color-7": palette.colors[6] ?? palette.colors[2] ?? palette.colors[0],
        "--wheel-surface": palette.colors[1] ?? palette.colors[0],
        "--wheel-surface-soft": palette.colors[2] ?? palette.colors[1] ?? palette.colors[0],
        "--wheel-accent": palette.colors[0],
        "--wheel-accent-strong": palette.colors[3] ?? palette.colors[0],
        "--wheel-contrast": palette.textColor,
        "--wheel-canvas-text": palette.canvasTextColor,
    } as CSSProperties;
};

const getWheelGradient = (wheel: WheelTrainerWheel) => {
    const palette = THEME_PRESETS[wheel.themeKey];

    if (wheel.options.length === 0) {
        return `linear-gradient(135deg, ${palette.colors[0]}, ${palette.colors[1] ?? palette.colors[0]})`;
    }

    const angleSize = 360 / wheel.options.length;
    const segments = wheel.options.map((_, index) => {
        const start = angleSize * index;
        const end = angleSize * (index + 1);
        return `${palette.colors[index % palette.colors.length]} ${start}deg ${end}deg`;
    });

    return `conic-gradient(from -90deg, ${segments.join(", ")})`;
};

const getWheelTargetRotation = (wheel: WheelTrainerWheel, winnerIndex: number) => {
    const angleSize = 360 / Math.max(wheel.options.length, 1);
    const centerAngle = winnerIndex * angleSize + angleSize / 2;
    const currentRotation = ((wheel.rotation % 360) + 360) % 360;
    const targetRotation = (360 - centerAngle + 360) % 360;
    const delta = (targetRotation - currentRotation + 360) % 360;
    const extraTurns = Math.round((wheel.durationMs / 1000) * (wheel.speed * 0.9 + 4));

    return wheel.rotation + extraTurns * 360 + delta;
};

const buildTemplateWheels = (wheels: WheelTrainerWheel[]) => {
    return wheels.map((wheel) => ({
        ...cloneWheelForStorage(wheel),
        rotation: 0,
        isSpinning: false,
        lastResultOptionId: null,
    }));
};

const buildDefaultTemplateName = () => {
    return `Шаблон ${new Date().toLocaleDateString("ru-RU")}`;
};

const WHEEL_DISC_RADIUS = 150;
const WHEEL_CENTER_CAP_RADIUS = 47;
const WHEEL_LABEL_OUTER_PADDING = 18;
const WHEEL_LABEL_INNER_PADDING = 18;

const estimateLabelUnits = (label: string) => {
    return Array.from(label).reduce((sum, char) => {
        if (/\s/.test(char)) {
            return sum + 0.32;
        }

        if (/[A-ZА-ЯЁ0-9]/.test(char)) {
            return sum + 0.72;
        }

        if (/[a-zа-яё]/.test(char)) {
            return sum + 0.6;
        }

        if (/[\u3040-\u30ff\u3400-\u9fff]/.test(char)) {
            return sum + 1;
        }

        return sum + 0.74;
    }, 0);
};

const getSegmentLabelStyle = (label: string, angle: number, sectorsCount: number): CSSProperties => {
    const innerRadius = WHEEL_CENTER_CAP_RADIUS + WHEEL_LABEL_INNER_PADDING;
    const outerRadius = WHEEL_DISC_RADIUS - WHEEL_LABEL_OUTER_PADDING;
    const labelCenterRadius = innerRadius + (outerRadius - innerRadius) / 2;
    const radialLength = Math.max(outerRadius - innerRadius - 6, 40);
    const sectorAngleRadians = (Math.PI * 2) / Math.max(sectorsCount, 1);
    const sectorThickness = Math.max(2 * labelCenterRadius * Math.sin(sectorAngleRadians / 2) - 8, 10);
    const estimatedLabelUnits = Math.max(estimateLabelUnits(label), 1.4);
    const sizeFromLength = radialLength / estimatedLabelUnits;
    const sizeFromSector = sectorThickness * 0.78;
    const fontSize = clampNumber(Math.min(sizeFromLength, sizeFromSector, 16), 7, 16);

    return {
        width: `${radialLength}px`,
        height: `${sectorThickness}px`,
        fontSize: `${fontSize}px`,
        lineHeight: 1,
        transform: `translate(-50%, -50%) rotate(${angle - 90}deg) translate(${labelCenterRadius}px, 0)`,
    };
};

const formatOptionsText = (options: WheelTrainerOption[]) => {
    return options.map((option) => option.label).join("\n");
};

const parseOptionsText = (value: string, existingOptions: WheelTrainerOption[]) => {
    const nextLabels = value
        .replace(/\r/g, "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

    return nextLabels.map((label, index) => ({
        id: existingOptions[index]?.id ?? createId("option"),
        label,
    }));
};

const syncWheelOptionEditor = (wheel: WheelTrainerWheel): WheelTrainerWheel => {
    return {
        ...wheel,
        optionsEditorText: formatOptionsText(wheel.options),
    };
};

const WheelTrainerPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const timersRef = useRef<Record<string, number>>({});
    const pendingRunRef = useRef<{
        remaining: number;
        startedAt: string;
        results: SpinResultItem[];
    } | null>(null);
    const bannerTimerRef = useRef<number | null>(null);

    const [wheels, setWheels] = useState<WheelTrainerWheel[]>(() => [createWheel(1)]);
    const [templates, setTemplates] = useState<WheelTrainerTemplate[]>([]);
    const [history, setHistory] = useState<SpinHistoryEntry[]>([]);
    const [activeWheelId, setActiveWheelId] = useState<string | null>(null);
    const [templateNameDraft, setTemplateNameDraft] = useState<string>(buildDefaultTemplateName());
    const [loadedTemplateId, setLoadedTemplateId] = useState<string | null>(null);
    const [resultDialog, setResultDialog] = useState<ResultDialogState | null>(null);
    const [lastRemovedAction, setLastRemovedAction] = useState<RemovedOptionAction | null>(null);
    const [banner, setBanner] = useState<string>("");
    const [studioTab, setStudioTab] = useState<StudioTab>("edit");

    const isStudioView = location.pathname === WHEEL_TRAINER_ROUTE_STUDIO;
    const isTemplatesView = location.pathname === WHEEL_TRAINER_ROUTE_TEMPLATES;
    const isHubView = !isStudioView && !isTemplatesView;
    const isEditTab = studioTab === "edit";
    const isSpinTab = studioTab === "spin";
    const spinVisibleWheels = wheels.filter((wheel) => wheel.options.length > 0);
    const activeWheel = wheels.find((wheel) => wheel.id === activeWheelId) ?? null;
    const renderedWheels = isSpinTab ? spinVisibleWheels : wheels;
    const unlockedWheels = wheels.filter((wheel) => !wheel.isLocked);
    const isAnyWheelSpinning = wheels.some((wheel) => wheel.isSpinning);

    const setBannerMessage = (nextBanner: string) => {
        setBanner(nextBanner);
        if (bannerTimerRef.current !== null) {
            window.clearTimeout(bannerTimerRef.current);
        }

        bannerTimerRef.current = window.setTimeout(() => {
            setBanner("");
            bannerTimerRef.current = null;
        }, 3200);
    };

    useEffect(() => {
        setTemplates(readTemplatesFromStorage());

        try {
            const rawDraft = window.localStorage.getItem(WHEEL_TRAINER_DRAFT_STORAGE_KEY);
            if (rawDraft === null) {
                setActiveWheelId((current) => current ?? wheels[0]?.id ?? null);
                return;
            }

            const parsedDraft = JSON.parse(rawDraft);
            if (!isRecord(parsedDraft) || !Array.isArray(parsedDraft.wheels)) {
                throw new Error("Invalid draft payload");
            }

            const nextWheels = parsedDraft.wheels.map((wheel, index) => sanitizeWheel(wheel, index));
            setWheels(nextWheels.length > 0 ? nextWheels : [createWheel(1)]);
            setTemplateNameDraft(
                typeof parsedDraft.templateNameDraft === "string" && parsedDraft.templateNameDraft.trim()
                    ? parsedDraft.templateNameDraft.trim()
                    : buildDefaultTemplateName(),
            );
            setLoadedTemplateId(typeof parsedDraft.loadedTemplateId === "string" ? parsedDraft.loadedTemplateId : null);
            setActiveWheelId(
                typeof parsedDraft.activeWheelId === "string" ? parsedDraft.activeWheelId : (nextWheels[0]?.id ?? null),
            );
        } catch {
            setBannerMessage("Черновик Wheel Trainer поврежден и был сброшен.");
            setWheels([createWheel(1)]);
            setActiveWheelId(null);
        }

        return () => {
            Object.values(timersRef.current).forEach((timerId) => window.clearTimeout(timerId));
            if (bannerTimerRef.current !== null) {
                window.clearTimeout(bannerTimerRef.current);
            }
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (wheels.length === 0) {
            const freshWheel = createWheel(1);
            setWheels([freshWheel]);
            setActiveWheelId(freshWheel.id);
            return;
        }

        if (!activeWheelId || !wheels.some((wheel) => wheel.id === activeWheelId)) {
            setActiveWheelId(wheels[0].id);
        }
    }, [wheels, activeWheelId]);

    useEffect(() => {
        try {
            window.localStorage.setItem(
                WHEEL_TRAINER_DRAFT_STORAGE_KEY,
                JSON.stringify({
                    wheels: wheels.map((wheel) => cloneWheelForStorage(wheel)),
                    templateNameDraft,
                    loadedTemplateId,
                    activeWheelId,
                }),
            );
        } catch {
            setBannerMessage("Не удалось сохранить текущую сессию Wheel Trainer в браузере.");
        }
    }, [wheels, templateNameDraft, loadedTemplateId, activeWheelId]);

    useEffect(() => {
        if (!isStudioView) {
            return;
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement | null;
            const tagName = target?.tagName ?? "";
            const isTypingTarget =
                tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT" || target?.isContentEditable;

            if (event.key === "Enter" && resultDialog !== null) {
                event.preventDefault();
                setResultDialog(null);
                return;
            }

            if (event.code === "Space" && resultDialog !== null) {
                event.preventDefault();
                applyResultRemoval();
                return;
            }

            if (isTypingTarget) {
                return;
            }

            if (event.code === "Space") {
                event.preventDefault();
                if (event.shiftKey) {
                    spinAllWheels();
                } else {
                    spinActiveWheel();
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isStudioView, resultDialog, activeWheelId, wheels]);

    const persistTemplates = (nextTemplates: WheelTrainerTemplate[]) => {
        setTemplates(nextTemplates);
        window.localStorage.setItem(WHEEL_TRAINER_TEMPLATE_STORAGE_KEY, JSON.stringify(nextTemplates));
    };

    const updateWheel = (wheelId: string, updater: (wheel: WheelTrainerWheel) => WheelTrainerWheel) => {
        setWheels((currentWheels) => currentWheels.map((wheel) => (wheel.id === wheelId ? updater(wheel) : wheel)));
    };

    const updateAllWheels = (updater: (wheel: WheelTrainerWheel) => WheelTrainerWheel) => {
        setWheels((currentWheels) => currentWheels.map((wheel) => updater(wheel)));
    };

    const addWheelAfter = (wheelId: string) => {
        setWheels((currentWheels) => {
            const nextWheel = createWheel(currentWheels.length + 1);
            const currentIndex = currentWheels.findIndex((wheel) => wheel.id === wheelId);

            if (currentIndex === -1) {
                setActiveWheelId(nextWheel.id);
                return [...currentWheels, nextWheel];
            }

            const nextWheels = [...currentWheels];
            nextWheels.splice(currentIndex + 1, 0, nextWheel);
            setActiveWheelId(nextWheel.id);
            return nextWheels;
        });
    };

    const removeWheel = (wheelId: string) => {
        if (wheels.length === 1) {
            setBannerMessage("В сессии должна оставаться хотя бы одна рулетка.");
            return;
        }

        setWheels((currentWheels) => currentWheels.filter((wheel) => wheel.id !== wheelId));
    };

    const replaceWheelOptionsFromText = (wheelId: string, nextValue: string) => {
        updateWheel(wheelId, (currentWheel) => ({
            ...currentWheel,
            optionsEditorText: nextValue,
            options: parseOptionsText(nextValue, currentWheel.options),
            lastResultOptionId: null,
        }));
    };

    const registerRemovedOptions = (entries: RemovedOptionEntry[]) => {
        if (entries.length === 0) {
            return;
        }

        setLastRemovedAction({
            id: createId("removed"),
            removedAt: new Date().toISOString(),
            entries,
        });
    };

    const undoLastRemoval = () => {
        if (lastRemovedAction === null) {
            setBannerMessage("Последнее удаление не найдено.");
            return;
        }

        setWheels((currentWheels) =>
            currentWheels.map((wheel) => {
                const wheelEntries = lastRemovedAction.entries
                    .filter((entry) => entry.wheelId === wheel.id)
                    .sort((first, second) => first.insertIndex - second.insertIndex);

                if (wheelEntries.length === 0) {
                    return wheel;
                }

                const nextOptions = [...wheel.options];
                wheelEntries.forEach((entry) => {
                    const safeIndex = clampNumber(entry.insertIndex, 0, nextOptions.length);
                    nextOptions.splice(safeIndex, 0, entry.option);
                });

                return syncWheelOptionEditor({
                    ...wheel,
                    options: nextOptions,
                });
            }),
        );

        setLastRemovedAction(null);
        setBannerMessage("Последний удаленный вариант восстановлен.");
    };

    const finalizePendingRun = () => {
        const pendingRun = pendingRunRef.current;
        if (pendingRun === null || pendingRun.remaining > 0) {
            return;
        }

        const nextHistoryEntry: SpinHistoryEntry = {
            id: createId("history"),
            startedAt: pendingRun.startedAt,
            results: pendingRun.results,
        };

        setHistory((currentHistory) => [nextHistoryEntry, ...currentHistory].slice(0, MAX_HISTORY_ENTRIES));
        setResultDialog({
            results: pendingRun.results,
            startedAt: pendingRun.startedAt,
        });
        pendingRunRef.current = null;
    };

    const startSpin = (targets: WheelTrainerWheel[]) => {
        if (targets.length === 0) {
            setBannerMessage("Нет доступных рулеток для запуска.");
            return;
        }

        if (targets.some((wheel) => wheel.isSpinning)) {
            setBannerMessage("Дождитесь завершения текущего вращения.");
            return;
        }

        const preparedResults = targets
            .filter((wheel) => wheel.options.length > 0)
            .map((wheel) => {
                const winnerIndex = Math.floor(Math.random() * wheel.options.length);
                return {
                    wheelId: wheel.id,
                    wheelTitle: wheel.title,
                    option: wheel.options[winnerIndex],
                    themeKey: wheel.themeKey,
                    nextRotation: getWheelTargetRotation(wheel, winnerIndex),
                    durationMs: wheel.durationMs,
                };
            });

        if (preparedResults.length === 0) {
            setBannerMessage("В выбранных рулетках нет вариантов для вращения.");
            return;
        }

        setResultDialog(null);
        pendingRunRef.current = {
            remaining: preparedResults.length,
            startedAt: new Date().toISOString(),
            results: [],
        };

        setWheels((currentWheels) =>
            currentWheels.map((wheel) => {
                const nextSpin = preparedResults.find((item) => item.wheelId === wheel.id);
                if (!nextSpin) {
                    return wheel;
                }

                return {
                    ...wheel,
                    rotation: nextSpin.nextRotation,
                    isSpinning: true,
                    lastResultOptionId: null,
                };
            }),
        );

        preparedResults.forEach((result) => {
            timersRef.current[result.wheelId] = window.setTimeout(() => {
                setWheels((currentWheels) =>
                    currentWheels.map((wheel) => {
                        if (wheel.id !== result.wheelId) {
                            return wheel;
                        }

                        return {
                            ...wheel,
                            isSpinning: false,
                            lastResultOptionId: result.option.id,
                        };
                    }),
                );

                const pendingRun = pendingRunRef.current;
                if (pendingRun !== null) {
                    pendingRun.results.push({
                        wheelId: result.wheelId,
                        wheelTitle: result.wheelTitle,
                        option: result.option,
                        themeKey: result.themeKey,
                    });
                    pendingRun.remaining -= 1;
                }

                delete timersRef.current[result.wheelId];
                finalizePendingRun();
            }, result.durationMs);
        });
    };

    const spinActiveWheel = () => {
        const wheelToSpin = activeWheel ?? wheels[0] ?? null;
        if (wheelToSpin === null) {
            setBannerMessage("Выберите активную рулетку.");
            return;
        }

        startSpin([wheelToSpin]);
    };

    const spinAllWheels = () => {
        const targets = unlockedWheels.filter((wheel) => wheel.options.length > 0);
        if (targets.length === 0) {
            setBannerMessage("Для общего запуска нужны незаблокированные рулетки с вариантами.");
            return;
        }

        startSpin(targets);
    };

    const applyResultRemoval = () => {
        if (resultDialog === null) {
            return;
        }

        const removedEntries: RemovedOptionEntry[] = [];

        setWheels((currentWheels) =>
            currentWheels.map((wheel) => {
                const result = resultDialog.results.find((item) => item.wheelId === wheel.id);
                if (!result) {
                    return wheel;
                }

                const insertIndex = wheel.options.findIndex((option) => option.id === result.option.id);
                if (insertIndex < 0) {
                    return wheel;
                }

                removedEntries.push({
                    wheelId: wheel.id,
                    wheelTitle: wheel.title,
                    option: result.option,
                    insertIndex,
                });

                return syncWheelOptionEditor({
                    ...wheel,
                    options: wheel.options.filter((option) => option.id !== result.option.id),
                    lastResultOptionId: wheel.lastResultOptionId === result.option.id ? null : wheel.lastResultOptionId,
                });
            }),
        );

        setResultDialog(null);
        setBannerMessage("Выпавшие варианты удалены из текущей сессии.");
    };

    const saveTemplate = () => {
        const templateName = templateNameDraft.trim();
        if (!templateName) {
            setBannerMessage("Укажите название шаблона перед сохранением.");
            return;
        }

        const payloadWheels = buildTemplateWheels(wheels);
        const now = new Date().toISOString();
        const currentTemplate = templates.find((template) => template.id === loadedTemplateId);
        const nextTemplate: WheelTrainerTemplate = {
            id: currentTemplate?.id ?? createId("template"),
            name: templateName,
            createdAt: currentTemplate?.createdAt ?? now,
            updatedAt: now,
            wheels: payloadWheels,
        };

        const nextTemplates = currentTemplate
            ? templates.map((template) => (template.id === currentTemplate.id ? nextTemplate : template))
            : [nextTemplate, ...templates];

        persistTemplates(nextTemplates);
        setLoadedTemplateId(nextTemplate.id);
        setBannerMessage(currentTemplate ? "Шаблон обновлен." : "Шаблон сохранен.");
    };

    const openTemplateInStudio = (template: WheelTrainerTemplate) => {
        const nextWheels = buildTemplateWheels(template.wheels);
        setWheels(nextWheels);
        setActiveWheelId(nextWheels[0]?.id ?? null);
        setTemplateNameDraft(template.name);
        setLoadedTemplateId(template.id);
        setHistory([]);
        setResultDialog(null);
        setStudioTab("edit");
        navigate(WHEEL_TRAINER_ROUTE_STUDIO);
    };

    const deleteTemplate = (templateId: string) => {
        const nextTemplates = templates.filter((template) => template.id !== templateId);
        persistTemplates(nextTemplates);
        if (loadedTemplateId === templateId) {
            setLoadedTemplateId(null);
        }
    };

    const startFreshSession = () => {
        const freshWheel = createWheel(1);
        setWheels([freshWheel]);
        setActiveWheelId(freshWheel.id);
        setTemplateNameDraft(buildDefaultTemplateName());
        setLoadedTemplateId(null);
        setHistory([]);
        setResultDialog(null);
        setStudioTab("edit");
        navigate(WHEEL_TRAINER_ROUTE_STUDIO);
    };

    const resultThemeKey = resultDialog?.results[0]?.themeKey ?? activeWheel?.themeKey ?? "pink";
    const resultThemeStyle = getThemeStyle(resultThemeKey);

    const sortedTemplates = useMemo(() => {
        return [...templates].sort((first, second) => second.updatedAt.localeCompare(first.updatedAt));
    }, [templates]);

    return (
        <div className={styles.page}>
            <div className={styles.pageInner}>
                <div className={styles.pageHeader}>
                    <div>
                        <h1 className={styles.pageTitle}>Wheel Trainer</h1>
                    </div>
                    <div className={styles.headerActions}>
                        {!isStudioView && (
                            <button type="button" className={styles.primaryAction} onClick={startFreshSession}>
                                <i className="bi bi-plus-circle" aria-hidden="true"></i>
                                <span>Новая рулетка</span>
                            </button>
                        )}
                    </div>
                </div>

                {banner && (
                    <div className={styles.banner} role="status">
                        <i className="bi bi-stars" aria-hidden="true"></i>
                        <span>{banner}</span>
                    </div>
                )}

                {isHubView && (
                    <div className={styles.hubGrid}>
                        <button type="button" className={styles.hubCard} onClick={startFreshSession}>
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
                            <span className={styles.hubCardHint}>Сохранено: {templates.length}</span>
                        </Link>
                    </div>
                )}

                {isTemplatesView && (
                    <div className={styles.templatesGrid}>
                        {sortedTemplates.length === 0 ? (
                            <div className={styles.emptyState}>
                                <i className="bi bi-folder-x"></i>
                                <h2>Шаблонов пока нет</h2>
                                <p>
                                    Сохраните первую сессию Wheel Trainer, чтобы запускать наборы рулеток одним кликом.
                                </p>
                                <button type="button" className={styles.primaryAction} onClick={startFreshSession}>
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
                                                {template.wheels.length} рулеток • обновлен{" "}
                                                {formatDateTime(template.updatedAt)}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            className={styles.iconButton}
                                            aria-label="Удалить шаблон"
                                            onClick={() => deleteTemplate(template.id)}
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

                                    <button
                                        type="button"
                                        className={styles.primaryAction}
                                        onClick={() => openTemplateInStudio(template)}
                                    >
                                        <i className="bi bi-lightning-charge" aria-hidden="true"></i>
                                        <span>Загрузить шаблон</span>
                                    </button>
                                </article>
                            ))
                        )}
                    </div>
                )}

                {isStudioView && (
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

                        {isSpinTab && (
                            <div className={styles.toolbar}>
                                <div className={styles.toolbarMain}>
                                    <div className={styles.spinGlobalControls}>
                                        <label className={styles.spinGlobalField}>
                                            <div className={styles.spinGlobalFieldTop}>
                                                <span>Скорость</span>
                                                <strong>{activeWheel?.speed ?? wheels[0]?.speed ?? 6}</strong>
                                            </div>
                                            <input
                                                type="range"
                                                min="1"
                                                max="10"
                                                value={activeWheel?.speed ?? wheels[0]?.speed ?? 6}
                                                onChange={(event) => {
                                                    const nextSpeed = Number(event.target.value);
                                                    updateAllWheels((wheel) => ({
                                                        ...wheel,
                                                        speed: nextSpeed,
                                                    }));
                                                }}
                                            />
                                        </label>
                                        <label className={styles.spinGlobalField}>
                                            <div className={styles.spinGlobalFieldTop}>
                                                <span>Длительность</span>
                                                <strong>
                                                    {(
                                                        (activeWheel?.durationMs ?? wheels[0]?.durationMs ?? 5200) /
                                                        1000
                                                    ).toFixed(1)}{" "}
                                                    c
                                                </strong>
                                            </div>
                                            <input
                                                type="range"
                                                min="2000"
                                                max="12000"
                                                step="500"
                                                value={activeWheel?.durationMs ?? wheels[0]?.durationMs ?? 5200}
                                                onChange={(event) => {
                                                    const nextDurationMs = Number(event.target.value);
                                                    updateAllWheels((wheel) => ({
                                                        ...wheel,
                                                        durationMs: nextDurationMs,
                                                    }));
                                                }}
                                            />
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}

                        {isSpinTab ? (
                            <>
                                <div className={styles.spinActionBar}>
                                    <button
                                        type="button"
                                        className={styles.spinAllAction}
                                        onClick={spinAllWheels}
                                        disabled={isAnyWheelSpinning}
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
                                {renderedWheels.map((wheel) => {
                                    const wheelThemeStyle = getThemeStyle(wheel.themeKey);
                                    const angleSize = wheel.options.length > 0 ? 360 / wheel.options.length : 360;

                                    return (
                                        <article
                                            key={wheel.id}
                                            className={`${styles.wheelCard} ${activeWheelId === wheel.id ? styles.wheelCardActive : ""} ${
                                                isSpinTab ? styles.wheelCardSpin : ""
                                            }`}
                                            style={wheelThemeStyle}
                                            onClick={() => setActiveWheelId(wheel.id)}
                                        >
                                            {isEditTab && (
                                                <div className={styles.wheelCardHeader}>
                                                    <div className={styles.wheelTitleGroup}>
                                                        <input
                                                            className={styles.wheelTitleInput}
                                                            value={wheel.title}
                                                            onChange={(event) =>
                                                                updateWheel(wheel.id, (currentWheel) => ({
                                                                    ...currentWheel,
                                                                    title: event.target.value,
                                                                }))
                                                            }
                                                            onClick={(event) => event.stopPropagation()}
                                                        />
                                                        <div className={styles.wheelBadges}>
                                                            {activeWheelId === wheel.id && (
                                                                <span className={styles.badgeAccent}>Активная</span>
                                                            )}
                                                            {wheel.isLocked && (
                                                                <span className={styles.badgeSoft}>Заблокирована</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className={styles.wheelHeaderActions}>
                                                        <button
                                                            type="button"
                                                            className={styles.wheelAddButton}
                                                            aria-label="Добавить рулетку ниже"
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                addWheelAfter(wheel.id);
                                                            }}
                                                        >
                                                            <i className="bi bi-plus-lg" aria-hidden="true"></i>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className={styles.iconButton}
                                                            aria-label={
                                                                wheel.isLocked ? "Разблокировать" : "Заблокировать"
                                                            }
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                updateWheel(wheel.id, (currentWheel) => ({
                                                                    ...currentWheel,
                                                                    isLocked: !currentWheel.isLocked,
                                                                }));
                                                            }}
                                                        >
                                                            <i
                                                                className={`bi ${wheel.isLocked ? "bi-lock-fill" : "bi-unlock"}`}
                                                                aria-hidden="true"
                                                            ></i>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className={styles.iconButton}
                                                            aria-label="Удалить рулетку"
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                removeWheel(wheel.id);
                                                            }}
                                                        >
                                                            <i className="bi bi-x-lg" aria-hidden="true"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {isSpinTab && (
                                                <div className={styles.wheelSpinHeader}>
                                                    <div className={styles.wheelBadges}>
                                                        {activeWheelId === wheel.id && (
                                                            <span className={styles.badgeAccent}>Активная</span>
                                                        )}
                                                        {wheel.isLocked && (
                                                            <span className={styles.badgeSoft}>Заблокирована</span>
                                                        )}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        className={styles.iconButton}
                                                        aria-label={wheel.isLocked ? "Разблокировать" : "Заблокировать"}
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            updateWheel(wheel.id, (currentWheel) => ({
                                                                ...currentWheel,
                                                                isLocked: !currentWheel.isLocked,
                                                            }));
                                                        }}
                                                    >
                                                        <i
                                                            className={`bi ${wheel.isLocked ? "bi-lock-fill" : "bi-unlock"}`}
                                                            aria-hidden="true"
                                                        ></i>
                                                    </button>
                                                </div>
                                            )}

                                            <div
                                                className={`${styles.wheelCardBody} ${isSpinTab ? styles.wheelCardBodySpin : ""}`}
                                            >
                                                <div
                                                    className={`${styles.wheelVisualBlock} ${isSpinTab ? styles.wheelVisualBlockSpin : ""}`}
                                                    onClick={
                                                        isSpinTab
                                                            ? (event) => {
                                                                  event.stopPropagation();
                                                                  setActiveWheelId(wheel.id);
                                                                  if (!wheel.isSpinning && wheel.options.length > 0) {
                                                                      startSpin([wheel]);
                                                                  }
                                                              }
                                                            : undefined
                                                    }
                                                >
                                                    <div
                                                        className={`${styles.wheelFrame} ${isSpinTab ? styles.wheelFrameSpin : ""}`}
                                                    >
                                                        <div
                                                            className={`${styles.wheelPointer} ${styles.wheelPointerRight}`}
                                                        >
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
                                                                <div className={styles.wheelEmptyState}>
                                                                    Добавьте варианты
                                                                </div>
                                                            ) : (
                                                                wheel.options.map((option, index) => {
                                                                    const angle = index * angleSize + angleSize / 2;
                                                                    return (
                                                                        <div
                                                                            key={option.id}
                                                                            className={styles.segmentLabel}
                                                                            style={getSegmentLabelStyle(
                                                                                option.label,
                                                                                angle,
                                                                                wheel.options.length,
                                                                            )}
                                                                        >
                                                                            <span>{option.label}</span>
                                                                        </div>
                                                                    );
                                                                })
                                                            )}
                                                            <div className={styles.wheelCenterCap}>
                                                                <span>{wheel.options.length}</span>
                                                                <small>вариантов</small>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {isEditTab && <div className={styles.wheelFooterBar}></div>}
                                                </div>

                                                {isEditTab && (
                                                    <div
                                                        className={styles.wheelConfigBlock}
                                                        onClick={(event) => event.stopPropagation()}
                                                    >
                                                        <div className={styles.configGrid}>
                                                            <label className={styles.configField}>
                                                                <span>Скорость</span>
                                                                <input
                                                                    type="range"
                                                                    min="1"
                                                                    max="10"
                                                                    value={wheel.speed}
                                                                    onChange={(event) =>
                                                                        updateWheel(wheel.id, (currentWheel) => ({
                                                                            ...currentWheel,
                                                                            speed: Number(event.target.value),
                                                                        }))
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
                                                                        updateWheel(wheel.id, (currentWheel) => ({
                                                                            ...currentWheel,
                                                                            durationMs: Number(event.target.value),
                                                                        }))
                                                                    }
                                                                />
                                                                <strong>
                                                                    {(wheel.durationMs / 1000).toFixed(1)} c
                                                                </strong>
                                                            </label>
                                                        </div>

                                                        <div className={styles.themeStrip}>
                                                            {THEME_KEYS.map((themeKey) => (
                                                                <button
                                                                    key={themeKey}
                                                                    type="button"
                                                                    className={`${styles.themeSwatch} ${
                                                                        wheel.themeKey === themeKey
                                                                            ? styles.themeSwatchActive
                                                                            : ""
                                                                    }`}
                                                                    style={{
                                                                        background: `linear-gradient(135deg, ${THEME_PRESETS[
                                                                            themeKey
                                                                        ].colors
                                                                            .slice(0, 3)
                                                                            .join(", ")})`,
                                                                    }}
                                                                    title={THEME_PRESETS[themeKey].label}
                                                                    onClick={() =>
                                                                        updateWheel(wheel.id, (currentWheel) => ({
                                                                            ...currentWheel,
                                                                            themeKey,
                                                                        }))
                                                                    }
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
                                                                onChange={(event) =>
                                                                    replaceWheelOptionsFromText(
                                                                        wheel.id,
                                                                        event.target.value,
                                                                    )
                                                                }
                                                            />
                                                            <small>
                                                                Один Enter = новый вариант. Можно сразу вставить столбец
                                                                из Excel или любой список строк.
                                                            </small>
                                                        </label>
                                                    </div>
                                                )}
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>

                            {isEditTab && (
                                <aside className={styles.sidePanel}>
                                    <section className={styles.sideCard}>
                                        <div className={styles.sideCardTitle}>Последние результаты</div>
                                        {history.length === 0 ? (
                                            <p className={styles.sideCardEmpty}>
                                                После первого вращения здесь появится история.
                                            </p>
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
                            )}
                        </div>

                        {isEditTab && (
                            <div className={styles.editSaveBar}>
                                <label className={styles.templateNameField}>
                                    <span>Название шаблона</span>
                                    <input
                                        value={templateNameDraft}
                                        onChange={(event) => setTemplateNameDraft(event.target.value)}
                                        placeholder="Например, 5-А / глаголы"
                                    />
                                </label>
                                <button type="button" className={styles.primaryAction} onClick={saveTemplate}>
                                    <i className="bi bi-save" aria-hidden="true"></i>
                                    <span>{loadedTemplateId ? "Обновить шаблон" : "Сохранить шаблон"}</span>
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            <Modal
                show={resultDialog !== null}
                onHide={() => setResultDialog(null)}
                centered
                size="lg"
                contentClassName="modal-content-auto-height"
            >
                <div className={styles.resultModal} style={resultThemeStyle}>
                    <Modal.Header closeButton className={styles.resultModalHeader}>
                        <div className={styles.resultHero}>
                            <div className={styles.resultHeroBadge}>
                                <i className="bi bi-stars" aria-hidden="true"></i>
                                <span>
                                    {resultDialog?.results.length === 1 ? "Финальный выбор" : "Финальные выборы"}
                                </span>
                            </div>
                            <Modal.Title>
                                {resultDialog?.results.length === 1 ? "Результат рулетки" : "Результаты рулеток 🤩"}
                            </Modal.Title>
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
                            onClick={() => setResultDialog(null)}
                        >
                            Оставить
                        </button>
                        <button
                            type="button"
                            className={`${styles.primaryAction} ${styles.resultActionPrimary}`}
                            onClick={applyResultRemoval}
                        >
                            Удалить
                        </button>
                    </Modal.Footer>
                </div>
            </Modal>
        </div>
    );
};

export default WheelTrainerPage;
