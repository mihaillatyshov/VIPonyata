import { useEffect, useEffectEvent, useReducer, useRef, useState } from "react";

import { readWheelStudioDraft, wheelStudioReducer } from "./wheelStudioReducer";
import {
    buildDefaultTemplateName,
    buildTemplateWheels,
    cloneWheelForStorage,
    createId,
    createWheel,
    getWheelTargetRotation,
    MAX_HISTORY_ENTRIES,
    readTemplatesFromStorage,
    ResultDialogState,
    SpinHistoryEntry,
    SpinResultItem,
    WHEEL_TRAINER_DRAFT_STORAGE_KEY,
    WHEEL_TRAINER_TEMPLATE_STORAGE_KEY,
    WheelTrainerTemplate,
    WheelTrainerWheel,
} from "./wheelTrainerModel";

const BANNER_DURATION_MS = 3200;

/** Всплывающее сообщение, которое само скрывается через несколько секунд. */
const useBanner = () => {
    const [banner, setBanner] = useState("");
    const timerRef = useRef<number | null>(null);

    useEffect(
        () => () => {
            if (timerRef.current !== null) {
                window.clearTimeout(timerRef.current);
            }
        },
        [],
    );

    const showBanner = (message: string) => {
        setBanner(message);
        if (timerRef.current !== null) {
            window.clearTimeout(timerRef.current);
        }
        timerRef.current = window.setTimeout(() => {
            setBanner("");
            timerRef.current = null;
        }, BANNER_DURATION_MS);
    };

    return { banner, showBanner };
};

/**
 * Состояние Wheel Trainer: рулетки текущей сессии (черновик в localStorage), шаблоны, вращение и история.
 * Вращение анимируется CSS; результат фиксируется по таймеру длительности каждой рулетки.
 */
export const useWheelTrainerStudio = () => {
    const [initialDraft] = useState(readWheelStudioDraft);
    const [studio, dispatch] = useReducer(wheelStudioReducer, initialDraft.state);
    const [templates, setTemplates] = useState<WheelTrainerTemplate[]>(readTemplatesFromStorage);
    const [history, setHistory] = useState<SpinHistoryEntry[]>([]);
    const [resultDialog, setResultDialog] = useState<ResultDialogState | null>(null);
    const { banner, showBanner } = useBanner();

    const timersRef = useRef<Record<string, number>>({});
    const pendingRunRef = useRef<{ remaining: number; startedAt: string; results: SpinResultItem[] } | null>(null);

    const { wheels, activeWheelId } = studio;
    const activeWheel = wheels.find((wheel) => wheel.id === activeWheelId) ?? null;

    const reportDraftProblem = useEffectEvent((message: string) => showBanner(message));

    useEffect(() => {
        if (initialDraft.hasError) {
            reportDraftProblem("Черновик Wheel Trainer поврежден и был сброшен.");
        }
        const timers = timersRef.current;
        return () => Object.values(timers).forEach((timerId) => window.clearTimeout(timerId));
    }, [initialDraft.hasError]);

    useEffect(() => {
        try {
            window.localStorage.setItem(
                WHEEL_TRAINER_DRAFT_STORAGE_KEY,
                JSON.stringify({ ...studio, wheels: studio.wheels.map(cloneWheelForStorage) }),
            );
        } catch {
            reportDraftProblem("Не удалось сохранить текущую сессию Wheel Trainer в браузере.");
        }
    }, [studio]);

    const finalizePendingRun = () => {
        const pendingRun = pendingRunRef.current;
        if (pendingRun === null || pendingRun.remaining > 0) {
            return;
        }

        const entry: SpinHistoryEntry = {
            id: createId("history"),
            startedAt: pendingRun.startedAt,
            results: pendingRun.results,
        };
        setHistory((prev) => [entry, ...prev].slice(0, MAX_HISTORY_ENTRIES));
        setResultDialog({ results: pendingRun.results, startedAt: pendingRun.startedAt });
        pendingRunRef.current = null;
    };

    const startSpin = (targets: WheelTrainerWheel[]) => {
        if (targets.length === 0) {
            showBanner("Нет доступных рулеток для запуска.");
            return;
        }

        if (targets.some((wheel) => wheel.isSpinning)) {
            showBanner("Дождитесь завершения текущего вращения.");
            return;
        }

        const preparedResults = targets
            .filter((wheel) => wheel.options.length > 0)
            .map((wheel) => {
                const winnerIndex = Math.floor(Math.random() * wheel.options.length);
                return {
                    result: {
                        wheelId: wheel.id,
                        wheelTitle: wheel.title,
                        option: wheel.options[winnerIndex],
                        themeKey: wheel.themeKey,
                    } satisfies SpinResultItem,
                    rotation: getWheelTargetRotation(wheel, winnerIndex),
                    durationMs: wheel.durationMs,
                };
            });

        if (preparedResults.length === 0) {
            showBanner("В выбранных рулетках нет вариантов для вращения.");
            return;
        }

        setResultDialog(null);
        pendingRunRef.current = { remaining: preparedResults.length, startedAt: new Date().toISOString(), results: [] };
        dispatch({
            type: "startSpin",
            spins: preparedResults.map(({ result, rotation }) => ({ wheelId: result.wheelId, rotation })),
        });

        preparedResults.forEach(({ result, durationMs }) => {
            timersRef.current[result.wheelId] = window.setTimeout(() => {
                dispatch({ type: "finishSpin", wheelId: result.wheelId, optionId: result.option.id });

                const pendingRun = pendingRunRef.current;
                if (pendingRun !== null) {
                    pendingRun.results.push(result);
                    pendingRun.remaining -= 1;
                }

                delete timersRef.current[result.wheelId];
                finalizePendingRun();
            }, durationMs);
        });
    };

    const spinActiveWheel = () => {
        const wheelToSpin = activeWheel ?? wheels[0] ?? null;
        if (wheelToSpin === null) {
            showBanner("Выберите активную рулетку.");
            return;
        }

        startSpin([wheelToSpin]);
    };

    const spinAllWheels = () => {
        const targets = wheels.filter((wheel) => !wheel.isLocked && wheel.options.length > 0);
        if (targets.length === 0) {
            showBanner("Для общего запуска нужны незаблокированные рулетки с вариантами.");
            return;
        }

        startSpin(targets);
    };

    /** «Удалить» в окне результата: выпавшие варианты убираются из рулеток. */
    const applyResultRemoval = () => {
        if (resultDialog === null) {
            return;
        }

        dispatch({
            type: "removeOptions",
            options: resultDialog.results.map((result) => ({ wheelId: result.wheelId, optionId: result.option.id })),
        });
        setResultDialog(null);
        showBanner("Выпавшие варианты удалены из текущей сессии.");
    };

    const addWheelAfter = (wheelId: string) => {
        dispatch({ type: "addWheelAfter", wheelId, wheel: createWheel(wheels.length + 1) });
    };

    const removeWheel = (wheelId: string) => {
        if (wheels.length === 1) {
            showBanner("В сессии должна оставаться хотя бы одна рулетка.");
            return;
        }

        dispatch({ type: "removeWheel", wheelId });
    };

    const persistTemplates = (nextTemplates: WheelTrainerTemplate[]) => {
        setTemplates(nextTemplates);
        window.localStorage.setItem(WHEEL_TRAINER_TEMPLATE_STORAGE_KEY, JSON.stringify(nextTemplates));
    };

    const saveTemplate = () => {
        const templateName = studio.templateNameDraft.trim();
        if (!templateName) {
            showBanner("Укажите название шаблона перед сохранением.");
            return;
        }

        const now = new Date().toISOString();
        const currentTemplate = templates.find((template) => template.id === studio.loadedTemplateId);
        const nextTemplate: WheelTrainerTemplate = {
            id: currentTemplate?.id ?? createId("template"),
            name: templateName,
            createdAt: currentTemplate?.createdAt ?? now,
            updatedAt: now,
            wheels: buildTemplateWheels(wheels),
        };

        persistTemplates(
            currentTemplate
                ? templates.map((template) => (template.id === currentTemplate.id ? nextTemplate : template))
                : [nextTemplate, ...templates],
        );
        dispatch({ type: "setLoadedTemplateId", templateId: nextTemplate.id });
        showBanner(currentTemplate ? "Шаблон обновлен." : "Шаблон сохранен.");
    };

    const deleteTemplate = (templateId: string) => {
        persistTemplates(templates.filter((template) => template.id !== templateId));
        if (studio.loadedTemplateId === templateId) {
            dispatch({ type: "setLoadedTemplateId", templateId: null });
        }
    };

    const startNewSession = (template: WheelTrainerTemplate | null) => {
        dispatch({
            type: "loadSession",
            wheels: template ? buildTemplateWheels(template.wheels) : [createWheel(1)],
            templateName: template?.name ?? buildDefaultTemplateName(),
            templateId: template?.id ?? null,
        });
        setHistory([]);
        setResultDialog(null);
    };

    return {
        studio,
        dispatch,
        activeWheel,
        templates,
        history,
        resultDialog,
        closeResultDialog: () => setResultDialog(null),
        banner,
        startSpin,
        spinActiveWheel,
        spinAllWheels,
        applyResultRemoval,
        addWheelAfter,
        removeWheel,
        saveTemplate,
        deleteTemplate,
        startNewSession,
    };
};

export type WheelTrainerStudio = ReturnType<typeof useWheelTrainerStudio>;
