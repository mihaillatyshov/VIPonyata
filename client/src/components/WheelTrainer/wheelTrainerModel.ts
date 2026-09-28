import { CSSProperties } from "react";

export type WheelThemeKey = "pink" | "yellow" | "blue" | "redWine" | "green" | "brown" | "forest" | "summer";

export interface WheelTrainerOption {
    id: string;
    label: string;
}

export interface WheelTrainerWheel {
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

export interface WheelTrainerTemplate {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    wheels: WheelTrainerWheel[];
}

export interface SpinResultItem {
    wheelId: string;
    wheelTitle: string;
    option: WheelTrainerOption;
    themeKey: WheelThemeKey;
}

export interface ResultDialogState {
    results: SpinResultItem[];
    startedAt: string;
}

export type StudioTab = "edit" | "spin";

export interface SpinHistoryEntry {
    id: string;
    startedAt: string;
    results: SpinResultItem[];
}

export interface ThemePreset {
    label: string;
    colors: string[];
    textColor: string;
    canvasTextColor: string;
}

export const WHEEL_TRAINER_TEMPLATE_STORAGE_KEY = "wheel-trainer-templates-v1";
export const WHEEL_TRAINER_DRAFT_STORAGE_KEY = "wheel-trainer-draft-v1";
export const WHEEL_TRAINER_ROUTE_STUDIO = "/teacher/wheel-trainer/new";
export const WHEEL_TRAINER_ROUTE_TEMPLATES = "/teacher/wheel-trainer/templates";
export const MAX_HISTORY_ENTRIES = 12;

export const THEME_PRESETS: Record<WheelThemeKey, ThemePreset> = {
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

export const THEME_KEYS = Object.keys(THEME_PRESETS) as WheelThemeKey[];

export const isRecord = (value: unknown): value is Record<string, unknown> => {
    return typeof value === "object" && value !== null;
};

export const clampNumber = (value: number, min: number, max: number) => {
    return Math.min(Math.max(value, min), max);
};

export const createId = (prefix: string) => {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
};

export const createDefaultOptions = () => {
    return Array.from({ length: 6 }, (_, index) => ({
        id: createId("option"),
        label: `Вариант ${index + 1}`,
    }));
};

export const createWheel = (index: number): WheelTrainerWheel => {
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

export const cloneWheelForStorage = (wheel: WheelTrainerWheel): WheelTrainerWheel => {
    return {
        ...wheel,
        rotation: wheel.rotation,
        isSpinning: false,
        lastResultOptionId: wheel.lastResultOptionId,
        optionsEditorText: wheel.optionsEditorText,
        options: wheel.options.map((option) => ({ ...option })),
    };
};

export const sanitizeOption = (value: unknown): WheelTrainerOption | null => {
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

export const sanitizeWheel = (value: unknown, index: number): WheelTrainerWheel => {
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

export const sanitizeTemplate = (value: unknown, index: number): WheelTrainerTemplate | null => {
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

export const readTemplatesFromStorage = () => {
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

export const formatDateTime = (value: string) => {
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

export const getThemeStyle = (themeKey: WheelThemeKey): CSSProperties => {
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

export const getWheelGradient = (wheel: WheelTrainerWheel) => {
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

export const getWheelTargetRotation = (wheel: WheelTrainerWheel, winnerIndex: number) => {
    const angleSize = 360 / Math.max(wheel.options.length, 1);
    const centerAngle = winnerIndex * angleSize + angleSize / 2;
    const currentRotation = ((wheel.rotation % 360) + 360) % 360;
    const targetRotation = (360 - centerAngle + 360) % 360;
    const delta = (targetRotation - currentRotation + 360) % 360;
    const extraTurns = Math.round((wheel.durationMs / 1000) * (wheel.speed * 0.9 + 4));

    return wheel.rotation + extraTurns * 360 + delta;
};

export const buildTemplateWheels = (wheels: WheelTrainerWheel[]) => {
    return wheels.map((wheel) => ({
        ...cloneWheelForStorage(wheel),
        rotation: 0,
        isSpinning: false,
        lastResultOptionId: null,
    }));
};

export const buildDefaultTemplateName = () => {
    return `Шаблон ${new Date().toLocaleDateString("ru-RU")}`;
};

export const WHEEL_DISC_RADIUS = 150;
export const WHEEL_CENTER_CAP_RADIUS = 47;
export const WHEEL_LABEL_OUTER_PADDING = 18;
export const WHEEL_LABEL_INNER_PADDING = 18;

export const estimateLabelUnits = (label: string) => {
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

export const getSegmentLabelStyle = (label: string, angle: number, sectorsCount: number): CSSProperties => {
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

export const formatOptionsText = (options: WheelTrainerOption[]) => {
    return options.map((option) => option.label).join("\n");
};

export const parseOptionsText = (value: string, existingOptions: WheelTrainerOption[]) => {
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

export const syncWheelOptionEditor = (wheel: WheelTrainerWheel): WheelTrainerWheel => {
    return {
        ...wheel,
        optionsEditorText: formatOptionsText(wheel.options),
    };
};
