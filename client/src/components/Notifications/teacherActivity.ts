import { TQuizletQuizType } from "models/TQuizlet";

/** Данные для карточки действия ученика (TeacherActivityCard): уведомления учителя и teacher/history. */

export interface TeacherActivityMetric {
    iconClass: string;
    label: string;
    value: string;
}

export interface TeacherActivityTypeMeta {
    label: string;
    iconClass: string;
    toneClass: string;
}

/** Тег, иконка и цвет карточки по типу действия. */
export const TEACHER_ACTIVITY_TYPE_META = {
    drilling_try: { label: "Лексика", iconClass: "bi-lightning-charge", toneClass: "notification__item--practice" },
    hieroglyph_try: { label: "Кандзи", iconClass: "bi-pencil-square", toneClass: "notification__item--glyph" },
    assessment_try: { label: "Тест", iconClass: "bi-ui-checks-grid", toneClass: "notification__item--assessment" },
    final_boss_try: { label: "Финальный босс", iconClass: "bi-trophy", toneClass: "notification__item--boss" },
    quizlet: { label: "Quizlet", iconClass: "bi-collection", toneClass: "notification__item--quizlet" },
    homework_try: {
        label: "Домашняя работа",
        iconClass: "bi-journal-check",
        toneClass: "notification__item--homework",
    },
    dictionary: { label: "Словарь", iconClass: "bi-journal-text", toneClass: "notification__item--dictionary" },
} satisfies Record<string, TeacherActivityTypeMeta>;

const QUIZLET_MODE_LABELS: Record<TQuizletQuizType, string> = {
    flashcards: "Карточки",
    pair: "Пары",
    writing: "Пишем",
};

const DIRECTION_LABELS: Record<string, string> = {
    jp_to_ru: "jp → ru",
    ru_to_jp: "ru → jp",
};

export const splitDateTime = (datetime?: string | null) => {
    if (!datetime) {
        return { date: "-", time: "-" };
    }

    const [date = "-", time = "-"] = datetime.split(" ");

    return { date, time };
};

/** Теги задания Quizlet: режим и направление перевода (у пар направления нет). */
export const getQuizletTags = (quizType?: string | null, direction?: string | null): string[] => {
    if (!quizType) {
        return [];
    }

    const tags = [QUIZLET_MODE_LABELS[quizType as TQuizletQuizType] ?? quizType];
    if (quizType !== "pair" && direction && DIRECTION_LABELS[direction]) {
        tags.push(DIRECTION_LABELS[direction]);
    }

    return tags;
};
