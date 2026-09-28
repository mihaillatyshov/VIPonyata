import { TQuizletCatalog } from "api/quizlet";
import { TQuizletAssignment, TQuizletAssignmentTarget, TQuizletWord } from "models/TQuizlet";

export const QUIZLET_SORT_STEP = 10;

export const getNextSort = (items: Array<{ sort: number }>) => {
    if (items.length === 0) {
        return QUIZLET_SORT_STEP;
    }

    return Math.max(...items.map((item) => item.sort)) + QUIZLET_SORT_STEP;
};

export const moveItem = <T extends { id: number }>(items: T[], itemId: number, direction: -1 | 1): T[] => {
    const currentIndex = items.findIndex((item) => item.id === itemId);
    const targetIndex = currentIndex + direction;

    if (currentIndex === -1 || targetIndex < 0 || targetIndex >= items.length) {
        return items;
    }

    const nextItems = [...items];
    const [item] = nextItems.splice(currentIndex, 1);
    nextItems.splice(targetIndex, 0, item);
    return nextItems;
};

/** Клик по кнопке/полю внутри карточки не должен открывать саму карточку. */
export const isCardInteractiveTarget = (target: EventTarget | null, currentTarget: HTMLElement | null) => {
    const element = target as HTMLElement | null;
    const interactiveElement = element?.closest("a, button, input, textarea, select, label, [role='button']");
    return interactiveElement !== null && interactiveElement !== currentTarget;
};

export const getSubgroupWords = (catalog: TQuizletCatalog, subgroupId: number): TQuizletWord[] => {
    const ids = new Set(
        catalog.subgroup_words.filter((item) => item.subgroup_id === subgroupId).map((item) => item.word_id),
    );
    return catalog.words.filter((word) => ids.has(word.id));
};

/** Количество уникальных слов в каждой теме. */
export const countWordsBySubgroup = (catalog: TQuizletCatalog) => {
    const wordIdsBySubgroup = new Map<number, Set<number>>();
    catalog.subgroup_words.forEach((item) => {
        const wordIds = wordIdsBySubgroup.get(item.subgroup_id) ?? new Set<number>();
        wordIds.add(item.word_id);
        wordIdsBySubgroup.set(item.subgroup_id, wordIds);
    });

    return new Map(Array.from(wordIdsBySubgroup.entries()).map(([subgroupId, ids]) => [subgroupId, ids.size]));
};

/** Количество уникальных слов в каждом уроке (слово в двух темах урока считается один раз). */
export const countWordsByGroup = (catalog: TQuizletCatalog) => {
    const groupBySubgroup = new Map(catalog.subgroups.map((subgroup) => [subgroup.id, subgroup.group_id]));
    const wordIdsByGroup = new Map<number, Set<number>>();

    catalog.subgroup_words.forEach((item) => {
        const groupId = groupBySubgroup.get(item.subgroup_id);
        if (groupId === undefined) {
            return;
        }
        const wordIds = wordIdsByGroup.get(groupId) ?? new Set<number>();
        wordIds.add(item.word_id);
        wordIdsByGroup.set(groupId, wordIds);
    });

    return new Map(Array.from(wordIdsByGroup.entries()).map(([groupId, ids]) => [groupId, ids.size]));
};

export const getAssignmentModeLabel = (item: TQuizletAssignment) => {
    if (item.quiz_type === "pair") {
        return "Пары";
    }

    const directionLabel = item.translation_direction === "ru_to_jp" ? "рус-яп" : "яп-рус";
    return `Карточки (${directionLabel})`;
};

export const getAssignmentTargetStatusLabel = (status: TQuizletAssignmentTarget["status"]) => {
    if (status === "completed") {
        return { text: "Выполнено", className: "text-success" };
    }

    if (status === "cancelled") {
        return { text: "Отменено", className: "text-muted" };
    }

    return { text: "", className: "text-muted" };
};
