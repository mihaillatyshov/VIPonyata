import {
    buildDefaultTemplateName,
    createWheel,
    isRecord,
    parseOptionsText,
    sanitizeWheel,
    syncWheelOptionEditor,
    WHEEL_TRAINER_DRAFT_STORAGE_KEY,
    WheelTrainerWheel,
} from "./wheelTrainerModel";

/** Текущая сессия студии; целиком сохраняется черновиком в localStorage. */
export interface WheelStudioState {
    wheels: WheelTrainerWheel[];
    activeWheelId: string | null;
    templateNameDraft: string;
    loadedTemplateId: string | null;
}

export type WheelStudioAction =
    | { type: "updateWheel"; wheelId: string; patch: Partial<WheelTrainerWheel> }
    | { type: "updateAllWheels"; patch: Partial<WheelTrainerWheel> }
    | { type: "setOptionsText"; wheelId: string; text: string }
    | { type: "addWheelAfter"; wheelId: string; wheel: WheelTrainerWheel }
    | { type: "removeWheel"; wheelId: string }
    | { type: "setActiveWheel"; wheelId: string }
    | { type: "startSpin"; spins: Array<{ wheelId: string; rotation: number }> }
    | { type: "finishSpin"; wheelId: string; optionId: string }
    /** Удалить выпавшие варианты из рулеток. */
    | { type: "removeOptions"; options: Array<{ wheelId: string; optionId: string }> }
    | { type: "loadSession"; wheels: WheelTrainerWheel[]; templateName: string; templateId: string | null }
    | { type: "setTemplateName"; name: string }
    | { type: "setLoadedTemplateId"; templateId: string | null };

const mapWheel = (
    wheels: WheelTrainerWheel[],
    wheelId: string,
    update: (wheel: WheelTrainerWheel) => WheelTrainerWheel,
) => wheels.map((wheel) => (wheel.id === wheelId ? update(wheel) : wheel));

/** Активная рулетка всегда существует. */
const withValidActiveWheel = (state: WheelStudioState): WheelStudioState =>
    state.wheels.some((wheel) => wheel.id === state.activeWheelId)
        ? state
        : { ...state, activeWheelId: state.wheels[0]?.id ?? null };

const reduce = (state: WheelStudioState, action: WheelStudioAction): WheelStudioState => {
    switch (action.type) {
        case "updateWheel":
            return {
                ...state,
                wheels: mapWheel(state.wheels, action.wheelId, (wheel) => ({ ...wheel, ...action.patch })),
            };
        case "updateAllWheels":
            return { ...state, wheels: state.wheels.map((wheel) => ({ ...wheel, ...action.patch })) };
        case "setOptionsText":
            return {
                ...state,
                wheels: mapWheel(state.wheels, action.wheelId, (wheel) => ({
                    ...wheel,
                    optionsEditorText: action.text,
                    options: parseOptionsText(action.text, wheel.options),
                    lastResultOptionId: null,
                })),
            };
        case "addWheelAfter": {
            const index = state.wheels.findIndex((wheel) => wheel.id === action.wheelId);
            const wheels = [...state.wheels];
            wheels.splice(index === -1 ? wheels.length : index + 1, 0, action.wheel);
            return { ...state, wheels, activeWheelId: action.wheel.id };
        }
        case "removeWheel":
            return state.wheels.length <= 1
                ? state
                : { ...state, wheels: state.wheels.filter((wheel) => wheel.id !== action.wheelId) };
        case "setActiveWheel":
            return { ...state, activeWheelId: action.wheelId };
        case "startSpin":
            return {
                ...state,
                wheels: state.wheels.map((wheel) => {
                    const spin = action.spins.find((item) => item.wheelId === wheel.id);
                    return spin
                        ? { ...wheel, rotation: spin.rotation, isSpinning: true, lastResultOptionId: null }
                        : wheel;
                }),
            };
        case "finishSpin":
            return {
                ...state,
                wheels: mapWheel(state.wheels, action.wheelId, (wheel) => ({
                    ...wheel,
                    isSpinning: false,
                    lastResultOptionId: action.optionId,
                })),
            };
        case "removeOptions":
            return {
                ...state,
                wheels: state.wheels.map((wheel) => {
                    const removed = action.options.find((item) => item.wheelId === wheel.id);
                    if (!removed || !wheel.options.some((option) => option.id === removed.optionId)) {
                        return wheel;
                    }

                    return syncWheelOptionEditor({
                        ...wheel,
                        options: wheel.options.filter((option) => option.id !== removed.optionId),
                        lastResultOptionId:
                            wheel.lastResultOptionId === removed.optionId ? null : wheel.lastResultOptionId,
                    });
                }),
            };
        case "loadSession":
            return {
                wheels: action.wheels,
                activeWheelId: action.wheels[0]?.id ?? null,
                templateNameDraft: action.templateName,
                loadedTemplateId: action.templateId,
            };
        case "setTemplateName":
            return { ...state, templateNameDraft: action.name };
        case "setLoadedTemplateId":
            return { ...state, loadedTemplateId: action.templateId };
    }
};

export const wheelStudioReducer = (state: WheelStudioState, action: WheelStudioAction) =>
    withValidActiveWheel(reduce(state, action));

/** Начальное состояние из черновика; `hasError` — черновик повреждён и сброшен. */
export const readWheelStudioDraft = (): { state: WheelStudioState; hasError: boolean } => {
    const freshWheel = createWheel(1);
    const freshState: WheelStudioState = {
        wheels: [freshWheel],
        activeWheelId: freshWheel.id,
        templateNameDraft: buildDefaultTemplateName(),
        loadedTemplateId: null,
    };

    try {
        const rawDraft = window.localStorage.getItem(WHEEL_TRAINER_DRAFT_STORAGE_KEY);
        if (rawDraft === null) {
            return { state: freshState, hasError: false };
        }

        const parsedDraft = JSON.parse(rawDraft);
        if (!isRecord(parsedDraft) || !Array.isArray(parsedDraft.wheels)) {
            throw new Error("Invalid draft payload");
        }

        const wheels = parsedDraft.wheels.map((wheel, index) => sanitizeWheel(wheel, index));
        const state: WheelStudioState = {
            wheels: wheels.length > 0 ? wheels : [freshWheel],
            activeWheelId: typeof parsedDraft.activeWheelId === "string" ? parsedDraft.activeWheelId : null,
            templateNameDraft:
                typeof parsedDraft.templateNameDraft === "string" && parsedDraft.templateNameDraft.trim()
                    ? parsedDraft.templateNameDraft.trim()
                    : buildDefaultTemplateName(),
            loadedTemplateId: typeof parsedDraft.loadedTemplateId === "string" ? parsedDraft.loadedTemplateId : null,
        };

        return { state: withValidActiveWheel(state), hasError: false };
    } catch {
        return { state: freshState, hasError: true };
    }
};
