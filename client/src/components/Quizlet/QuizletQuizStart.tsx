import { useEffect, useMemo, useState } from "react";

import { TQuizletGroup, TQuizletLesson, TQuizletSubgroup, TQuizletSubgroupWord, TQuizletWord } from "models/TQuizlet";

import "./QuizletShared.css";

interface StartPayload {
    quiz_type: "pair" | "flashcards";
    subgroup_ids: number[];
    user_subgroup_ids: number[];
    show_hints: boolean;
    translation_direction: "jp_to_ru" | "ru_to_jp";
    max_words: number;
}

interface Props {
    groups: TQuizletGroup[];
    subgroups: TQuizletSubgroup[];
    subgroupWords: TQuizletSubgroupWord[];
    words: TQuizletWord[];
    personalLesson: TQuizletLesson | null;
    personalSubgroups: TQuizletSubgroup[];
    personalWords: TQuizletWord[];
    onStart: (payload: StartPayload) => void;
}

const MAX_WORDS_PER_SESSION = 100;

const QuizletQuizStart = ({
    groups,
    subgroups,
    subgroupWords,
    words,
    personalLesson,
    personalSubgroups,
    personalWords,
    onStart,
}: Props) => {
    const [quizType, setQuizType] = useState<"pair" | "flashcards" | null>(null);
    const [showQuizTypeError, setShowQuizTypeError] = useState<boolean>(false);
    const [showDictionariesError, setShowDictionariesError] = useState<boolean>(false);
    const [showHints, setShowHints] = useState<boolean>(false);
    const [direction, setDirection] = useState<"jp_to_ru" | "ru_to_jp">("jp_to_ru");
    const [selectedTeacherSubgroups, setSelectedTeacherSubgroups] = useState<number[]>([]);
    const [selectedPersonalSubgroups, setSelectedPersonalSubgroups] = useState<number[]>([]);

    const selectedDictionariesCount = selectedTeacherSubgroups.length + selectedPersonalSubgroups.length;

    const wordsCountByGroup = useMemo(() => {
        const counts = new Map<number, number>();

        groups.forEach((group) => {
            const groupSubgroupIds = subgroups.filter((item) => item.group_id === group.id).map((item) => item.id);
            const groupWordIds = new Set(
                subgroupWords.filter((item) => groupSubgroupIds.includes(item.subgroup_id)).map((item) => item.word_id),
            );

            counts.set(group.id, groupWordIds.size);
        });

        return counts;
    }, [groups, subgroups, subgroupWords]);

    const personalLessonWordsCount = useMemo(() => {
        return new Set(personalWords.map((word) => word.id)).size;
    }, [personalWords]);

    const wordsCountBySubgroup = useMemo(() => {
        const counts = new Map<number, number>();

        subgroups.forEach((subgroup) => {
            const subgroupWordIds = new Set(
                subgroupWords.filter((item) => item.subgroup_id === subgroup.id).map((item) => item.word_id),
            );
            counts.set(subgroup.id, subgroupWordIds.size);
        });

        return counts;
    }, [subgroups, subgroupWords]);

    const personalWordsCountBySubgroup = useMemo(() => {
        const counts = new Map<number, number>();

        personalSubgroups.forEach((subgroup) => {
            const subgroupWordsCount = personalWords.filter((word) => word.subgroup_id === subgroup.id).length;
            counts.set(subgroup.id, subgroupWordsCount);
        });

        return counts;
    }, [personalSubgroups, personalWords]);

    const selectedWordsCount = useMemo(() => {
        const teacherWordIds = new Set(
            subgroupWords
                .filter((item) => selectedTeacherSubgroups.includes(item.subgroup_id))
                .map((item) => item.word_id),
        );
        const teacherWords = words.filter((word) => teacherWordIds.has(word.id));
        const selectedPersonalWords = personalWords.filter(
            (word) => word.subgroup_id !== undefined && selectedPersonalSubgroups.includes(word.subgroup_id),
        );

        const uniqueWords = new Set<string>();
        [...teacherWords, ...selectedPersonalWords].forEach((word) => {
            const ensuredChar = word.char_jp !== null && word.char_jp !== "" ? word.char_jp : word.word_jp;
            uniqueWords.add(`${ensuredChar}|${word.word_jp}|${word.ru}`);
        });

        return uniqueWords.size;
    }, [subgroupWords, selectedTeacherSubgroups, words, personalWords, selectedPersonalSubgroups]);

    const hasValidWordsCount = selectedWordsCount >= 2 && selectedWordsCount <= MAX_WORDS_PER_SESSION;

    useEffect(() => {
        if (selectedDictionariesCount > 0 && showDictionariesError) {
            setShowDictionariesError(false);
        }
    }, [selectedDictionariesCount, showDictionariesError]);

    const subgroupsByGroup = useMemo(() => {
        return groups.map((group) => ({
            group,
            subgroups: subgroups.filter((subgroup) => subgroup.group_id === group.id),
        }));
    }, [groups, subgroups]);

    const toggleSelection = (ids: number[], setIds: (value: number[]) => void, id: number) => {
        if (ids.includes(id)) {
            setIds(ids.filter((item) => item !== id));
            return;
        }
        setIds([...ids, id]);
    };

    const toggleGroup = (groupId: number) => {
        const groupSubgroupIds = subgroups.filter((item) => item.group_id === groupId).map((item) => item.id);
        const allSelected = groupSubgroupIds.every((id) => selectedTeacherSubgroups.includes(id));

        if (allSelected) {
            setSelectedTeacherSubgroups(selectedTeacherSubgroups.filter((id) => !groupSubgroupIds.includes(id)));
            return;
        }

        setSelectedTeacherSubgroups(Array.from(new Set([...selectedTeacherSubgroups, ...groupSubgroupIds])));
    };

    const togglePersonalGroup = () => {
        const personalSubgroupIds = personalSubgroups.map((item) => item.id);
        const allSelected = personalSubgroupIds.every((id) => selectedPersonalSubgroups.includes(id));

        if (allSelected) {
            setSelectedPersonalSubgroups(selectedPersonalSubgroups.filter((id) => !personalSubgroupIds.includes(id)));
            return;
        }

        setSelectedPersonalSubgroups(Array.from(new Set([...selectedPersonalSubgroups, ...personalSubgroupIds])));
    };

    const start = () => {
        if (quizType === null) {
            setShowQuizTypeError(true);
        } else {
            setShowQuizTypeError(false);
        }

        if (selectedDictionariesCount === 0) {
            setShowDictionariesError(true);
        } else {
            setShowDictionariesError(false);
        }

        if (quizType === null || selectedDictionariesCount === 0 || !hasValidWordsCount) {
            return;
        }

        onStart({
            quiz_type: quizType,
            subgroup_ids: selectedTeacherSubgroups,
            user_subgroup_ids: selectedPersonalSubgroups,
            show_hints: showHints,
            translation_direction: direction,
            max_words: MAX_WORDS_PER_SESSION,
        });
    };

    return (
        <div className="quizlet-main-container">
            <h4 className="mb-3">Выбери упражнение</h4>

            <div className="mb-3">
                <div className="row g-2">
                    <div className="col-12 col-md-6">
                        <button
                            type="button"
                            className={`w-100 text-start border rounded p-3 bg-white ${
                                quizType === "flashcards" ? "border-primary shadow-sm" : "border-light"
                            }`}
                            onClick={() => {
                                setQuizType("flashcards");
                                setShowQuizTypeError(false);
                            }}
                        >
                            <div className="d-flex align-items-center gap-2 mb-1">
                                <i className="bi bi-card-text fs-4 text-primary" />
                                <span className="fw-semibold">Карточки</span>
                            </div>
                            <div className="small text-muted">Классический формат карточек для запоминания.</div>
                        </button>
                        {quizType === "flashcards" && (
                            <div className="mt-2 border rounded p-2 bg-light">
                                <div className="small fw-semibold mb-2">Направление перевода</div>
                                <div className="d-flex gap-2">
                                    <button
                                        type="button"
                                        className={`btn btn-sm ${
                                            direction === "jp_to_ru" ? "btn-primary" : "btn-outline-secondary"
                                        }`}
                                        onClick={() => setDirection("jp_to_ru")}
                                    >
                                        jp → ru
                                    </button>
                                    <button
                                        type="button"
                                        className={`btn btn-sm ${
                                            direction === "ru_to_jp" ? "btn-primary" : "btn-outline-secondary"
                                        }`}
                                        onClick={() => setDirection("ru_to_jp")}
                                    >
                                        ru → jp
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="col-12 col-md-6">
                        <button
                            type="button"
                            className={`w-100 text-start border rounded p-3 bg-white ${
                                quizType === "pair" ? "border-primary shadow-sm" : "border-light"
                            }`}
                            onClick={() => {
                                setQuizType("pair");
                                setShowQuizTypeError(false);
                            }}
                        >
                            <div className="d-flex align-items-center gap-2 mb-1">
                                <i className="bi bi-grid-3x3-gap fs-4 text-primary" />
                                <span className="fw-semibold">Пары</span>
                            </div>
                            <div className="small text-muted">Соединяй совпадающие пары как можно быстрее.</div>
                        </button>
                    </div>
                </div>
            </div>

            <div className="form-check mb-3">
                <input
                    className="form-check-input"
                    id="quizletShowHints"
                    type="checkbox"
                    checked={showHints}
                    onChange={(e) => setShowHints(e.target.checked)}
                />
                <label className="form-check-label" htmlFor="quizletShowHints">
                    Показывать чтения для иероглифов
                </label>
            </div>

            <h4 className="mt-4 mb-3">Выбери словари</h4>
            <div className="mb-4">
                {personalLesson !== null && (
                    <div className="border rounded p-2 mb-2">
                        <div className="d-flex align-items-center mb-2">
                            <label className="form-check d-inline-flex align-items-center gap-2 mb-0 quizlet-group-checkbox-label">
                                <input
                                    className="form-check-input mt-0"
                                    type="checkbox"
                                    checked={
                                        personalSubgroups.length > 0 &&
                                        personalSubgroups.every((subgroup) =>
                                            selectedPersonalSubgroups.includes(subgroup.id),
                                        )
                                    }
                                    disabled={personalSubgroups.length === 0}
                                    ref={(input) => {
                                        if (input === null) {
                                            return;
                                        }

                                        const selectedCount = personalSubgroups.filter((subgroup) =>
                                            selectedPersonalSubgroups.includes(subgroup.id),
                                        ).length;
                                        input.indeterminate =
                                            selectedCount > 0 && selectedCount < personalSubgroups.length;
                                    }}
                                    onChange={(e) => {
                                        togglePersonalGroup();
                                        e.target.blur();
                                    }}
                                />
                                <span className="fw-bold text-dark quizlet-group-checkbox-title">
                                    Мой словарь
                                    <span className="quizlet-dictionary-word-count"> ({personalLessonWordsCount})</span>
                                </span>
                            </label>
                        </div>
                        {personalSubgroups.length === 0 && (
                            <div className="text-muted small">Добавьте подгруппы в личный урок</div>
                        )}
                        {personalSubgroups.length > 0 && (
                            <div className="d-flex flex-wrap gap-2">
                                {personalSubgroups.map((subgroup) => (
                                    <label key={subgroup.id} className="form-check me-3">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            checked={selectedPersonalSubgroups.includes(subgroup.id)}
                                            onChange={(e) => {
                                                toggleSelection(
                                                    selectedPersonalSubgroups,
                                                    setSelectedPersonalSubgroups,
                                                    subgroup.id,
                                                );
                                                e.target.blur();
                                            }}
                                        />
                                        <span className="form-check-label">
                                            {subgroup.title}
                                            <span className="quizlet-dictionary-word-count">
                                                {" "}
                                                ({personalWordsCountBySubgroup.get(subgroup.id) ?? 0})
                                            </span>
                                        </span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {subgroupsByGroup.map(({ group, subgroups: nestedSubgroups }) => (
                    <div key={group.id} className="border rounded p-2 mb-2">
                        <div className="d-flex align-items-center mb-2">
                            <label className="form-check d-inline-flex align-items-center gap-2 mb-0 quizlet-group-checkbox-label">
                                <input
                                    className="form-check-input mt-0"
                                    type="checkbox"
                                    checked={
                                        nestedSubgroups.length > 0 &&
                                        nestedSubgroups.every((subgroup) =>
                                            selectedTeacherSubgroups.includes(subgroup.id),
                                        )
                                    }
                                    disabled={nestedSubgroups.length === 0}
                                    ref={(input) => {
                                        if (input === null) {
                                            return;
                                        }

                                        const selectedCount = nestedSubgroups.filter((subgroup) =>
                                            selectedTeacherSubgroups.includes(subgroup.id),
                                        ).length;
                                        input.indeterminate =
                                            selectedCount > 0 && selectedCount < nestedSubgroups.length;
                                    }}
                                    onChange={(e) => {
                                        toggleGroup(group.id);
                                        e.target.blur();
                                    }}
                                />
                                <span className="fw-bold text-dark quizlet-group-checkbox-title">
                                    {group.title}
                                    <span className="quizlet-dictionary-word-count">
                                        {" "}
                                        ({wordsCountByGroup.get(group.id) ?? 0})
                                    </span>
                                </span>
                            </label>
                        </div>
                        <div className="d-flex flex-wrap gap-2">
                            {nestedSubgroups.map((subgroup) => (
                                <label key={subgroup.id} className="form-check me-3">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        checked={selectedTeacherSubgroups.includes(subgroup.id)}
                                        onChange={(e) => {
                                            toggleSelection(
                                                selectedTeacherSubgroups,
                                                setSelectedTeacherSubgroups,
                                                subgroup.id,
                                            );
                                            e.target.blur();
                                        }}
                                    />
                                    <span className="form-check-label">
                                        {subgroup.title}
                                        <span className="quizlet-dictionary-word-count">
                                            {" "}
                                            ({wordsCountBySubgroup.get(subgroup.id) ?? 0})
                                        </span>
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="d-flex justify-content-end align-items-center flex-wrap gap-2">
                {showDictionariesError && <span className="text-danger small">выбери словари!</span>}
                {showQuizTypeError && <span className="text-danger small">выбери упражнение!</span>}
                <span
                    className={`quizlet-selected-words-counter ${
                        selectedWordsCount > MAX_WORDS_PER_SESSION ? "quizlet-selected-words-counter-overlimit" : ""
                    }`}
                >
                    {selectedWordsCount} / {MAX_WORDS_PER_SESSION}
                </span>
                <button
                    type="button"
                    className="btn btn-primary quizlet-start-training-btn"
                    onClick={start}
                    disabled={selectedWordsCount > MAX_WORDS_PER_SESSION}
                >
                    Начать тренировку
                </button>
            </div>
        </div>
    );
};

export default QuizletQuizStart;
