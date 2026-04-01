import { useMemo, useState } from "react";

import { TQuizletGroup, TQuizletLesson, TQuizletSubgroup } from "models/TQuizlet";

interface StartPayload {
    quiz_type: "pair" | "flashcards";
    subgroup_ids: number[];
    user_subgroup_ids: number[];
    show_hints: boolean;
    translation_direction: "jp_to_ru" | "ru_to_jp";
}

interface Props {
    groups: TQuizletGroup[];
    subgroups: TQuizletSubgroup[];
    personalLesson: TQuizletLesson | null;
    personalSubgroups: TQuizletSubgroup[];
    onStart: (payload: StartPayload) => void;
}

const QuizletQuizStart = ({ groups, subgroups, personalLesson, personalSubgroups, onStart }: Props) => {
    const [quizType, setQuizType] = useState<"pair" | "flashcards">("pair");
    const [showHints, setShowHints] = useState<boolean>(false);
    const [direction, setDirection] = useState<"jp_to_ru" | "ru_to_jp">("jp_to_ru");
    const [selectedTeacherSubgroups, setSelectedTeacherSubgroups] = useState<number[]>([]);
    const [selectedPersonalSubgroups, setSelectedPersonalSubgroups] = useState<number[]>([]);

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

    const start = () => {
        onStart({
            quiz_type: quizType,
            subgroup_ids: selectedTeacherSubgroups,
            user_subgroup_ids: selectedPersonalSubgroups,
            show_hints: showHints,
            translation_direction: direction,
        });
    };

    return (
        <div className="card p-3 p-md-4">
            <h4 className="mb-3">Настройки тренировки</h4>

            <div className="mb-3">
                <label className="form-label">Тип упражнения</label>
                <select className="form-select" value={quizType} onChange={(e) => setQuizType(e.target.value as any)}>
                    <option value="pair">Pair matching</option>
                    <option value="flashcards">Flashcards</option>
                </select>
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
                    Показывать чтение в скобках рядом с иероглифом
                </label>
            </div>

            <div className="mb-4">
                <label className="form-label">Направление перевода для карточек</label>
                <select className="form-select" value={direction} onChange={(e) => setDirection(e.target.value as any)}>
                    <option value="jp_to_ru">jp (char_jp) → ru</option>
                    <option value="ru_to_jp">ru → jp (char_jp)</option>
                </select>
            </div>

            <h5 className="mb-2">Словари преподавателя</h5>
            <div className="mb-4">
                {subgroupsByGroup.map(({ group, subgroups: nestedSubgroups }) => (
                    <div key={group.id} className="border rounded p-2 mb-2">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <strong>{group.title}</strong>
                            <button className="btn btn-sm btn-outline-secondary" onClick={() => toggleGroup(group.id)}>
                                Выбрать группу целиком
                            </button>
                        </div>
                        <div className="d-flex flex-wrap gap-2">
                            {nestedSubgroups.map((subgroup) => (
                                <label key={subgroup.id} className="form-check me-3">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        checked={selectedTeacherSubgroups.includes(subgroup.id)}
                                        onChange={() =>
                                            toggleSelection(
                                                selectedTeacherSubgroups,
                                                setSelectedTeacherSubgroups,
                                                subgroup.id,
                                            )
                                        }
                                    />
                                    <span className="form-check-label">{subgroup.title}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <h5 className="mb-2">Личный словарь</h5>
            <div className="mb-4">
                {personalLesson === null && <div className="text-muted">Личный урок пока не создан</div>}
                {personalLesson !== null && personalSubgroups.length === 0 && (
                    <div className="text-muted">Добавьте подгруппы в личный урок</div>
                )}
                {personalSubgroups.length > 0 && (
                    <div className="d-flex flex-wrap gap-2">
                        {personalSubgroups.map((subgroup) => (
                            <label key={subgroup.id} className="form-check me-3">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={selectedPersonalSubgroups.includes(subgroup.id)}
                                    onChange={() =>
                                        toggleSelection(
                                            selectedPersonalSubgroups,
                                            setSelectedPersonalSubgroups,
                                            subgroup.id,
                                        )
                                    }
                                />
                                <span className="form-check-label">{subgroup.title}</span>
                            </label>
                        ))}
                    </div>
                )}
            </div>

            <button
                className="btn btn-primary"
                onClick={start}
                disabled={selectedTeacherSubgroups.length + selectedPersonalSubgroups.length === 0}
            >
                Начать тренировку
            </button>
        </div>
    );
};

export default QuizletQuizStart;
