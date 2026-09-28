import { Dispatch, useMemo, useReducer, useState } from "react";

import {
    createQuizletAssignment,
    quizletKeys,
    quizletQueries,
    TQuizletCatalog,
    TQuizletPersonalDictionary,
    TQuizletStudentOption,
} from "api/quizlet";
import { getApiErrorMessage } from "libs/ServerAPI";

import { useMutation, useQueries, useQuery, useQueryClient, UseQueryResult } from "@tanstack/react-query";

import { AssignmentFormAction, assignmentFormReducer, initialAssignmentFormState } from "./assignmentFormReducer";
import { countWordsByGroup, countWordsBySubgroup } from "./teacherQuizletUtils";

interface QuizTypeOptionProps {
    isSelected: boolean;
    icon: string;
    title: string;
    description: string;
    onSelect: () => void;
}

const QuizTypeOption = ({ isSelected, icon, title, description, onSelect }: QuizTypeOptionProps) => (
    <div className="col-12 col-md-6">
        <button
            type="button"
            className={`w-100 text-start border rounded p-3 bg-white ${
                isSelected ? "border-primary shadow-sm" : "border-light"
            }`}
            onClick={onSelect}
        >
            <div className="d-flex align-items-center gap-2 mb-1">
                <i className={`bi ${icon} fs-4 text-primary`} />
                <span className="fw-semibold">{title}</span>
            </div>
            <div className="small text-muted">{description}</div>
        </button>
    </div>
);

interface CatalogDictionaryPickerProps {
    catalog: TQuizletCatalog;
    selectedSubgroupIds: number[];
    expandedGroupIds: number[];
    dispatch: Dispatch<AssignmentFormAction>;
}

const CatalogDictionaryPicker = ({
    catalog,
    selectedSubgroupIds,
    expandedGroupIds,
    dispatch,
}: CatalogDictionaryPickerProps) => {
    const wordsCountByGroup = useMemo(() => countWordsByGroup(catalog), [catalog]);
    const wordsCountBySubgroup = useMemo(() => countWordsBySubgroup(catalog), [catalog]);
    const subgroupsByGroup = useMemo(
        () =>
            catalog.groups.map((group) => ({
                group,
                subgroups: catalog.subgroups.filter((subgroup) => subgroup.group_id === group.id),
            })),
        [catalog],
    );
    const allGroupIds = catalog.groups.map((group) => group.id);
    const areAllExpanded = allGroupIds.every((groupId) => expandedGroupIds.includes(groupId));

    return (
        <div>
            <div className="d-flex align-items-center justify-content-between gap-2 mb-2 flex-wrap">
                <label className="form-label mb-0">Словари</label>
                <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary quizlet-setup-expand-all-btn"
                    onClick={() => dispatch({ type: "setExpandedGroups", groupIds: areAllExpanded ? [] : allGroupIds })}
                >
                    {areAllExpanded ? "Свернуть все" : "Раскрыть все"}
                </button>
            </div>
            <div className="d-flex flex-column gap-2">
                {subgroupsByGroup.map(({ group, subgroups }) => {
                    const selectedCount = subgroups.filter((subgroup) =>
                        selectedSubgroupIds.includes(subgroup.id),
                    ).length;
                    const isExpanded = expandedGroupIds.includes(group.id);

                    return (
                        <div key={group.id} className="quizlet-setup-dictionary-card">
                            <div className="quizlet-setup-dictionary-header">
                                <div className="quizlet-setup-dictionary-checkbox-wrap">
                                    <input
                                        className="form-check-input mt-0"
                                        type="checkbox"
                                        checked={subgroups.length > 0 && selectedCount === subgroups.length}
                                        disabled={subgroups.length === 0}
                                        ref={(input) => {
                                            if (input !== null) {
                                                input.indeterminate =
                                                    selectedCount > 0 && selectedCount < subgroups.length;
                                            }
                                        }}
                                        onChange={(event) => {
                                            dispatch({
                                                type: "toggleGroupSubgroups",
                                                subgroupIds: subgroups.map((subgroup) => subgroup.id),
                                            });
                                            event.target.blur();
                                        }}
                                    />
                                </div>
                                <button
                                    type="button"
                                    className="quizlet-setup-dictionary-toggle"
                                    onClick={() => dispatch({ type: "toggleGroupExpanded", groupId: group.id })}
                                    aria-expanded={isExpanded}
                                    aria-controls={`assignment-group-subgroups-${group.id}`}
                                >
                                    <span className="quizlet-setup-dictionary-toggle-icon" aria-hidden="true">
                                        {isExpanded ? "−" : "+"}
                                    </span>
                                    <span className="fw-bold text-dark quizlet-group-checkbox-title">
                                        {group.title}
                                        <span className="quizlet-dictionary-word-count">
                                            {` (${wordsCountByGroup.get(group.id) ?? 0})`}
                                        </span>
                                    </span>
                                    {selectedCount > 0 && (
                                        <span className="quizlet-setup-selected-badge">{selectedCount} выбрано</span>
                                    )}
                                </button>
                            </div>

                            {subgroups.length === 0 && (
                                <div className="text-muted small quizlet-setup-empty-state">
                                    В уроке пока нет словарей
                                </div>
                            )}

                            {subgroups.length > 0 && (
                                <div
                                    id={`assignment-group-subgroups-${group.id}`}
                                    className={`quizlet-setup-topics-collapse ${isExpanded ? "is-expanded" : ""}`}
                                >
                                    <div className="quizlet-setup-topics-collapse-inner">
                                        <div className="d-flex flex-wrap gap-2 quizlet-setup-topic-list">
                                            {subgroups.map((subgroup) => (
                                                <label
                                                    key={subgroup.id}
                                                    className="form-check me-3 quizlet-topic-checkbox-label quizlet-setup-topic-chip"
                                                >
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        checked={selectedSubgroupIds.includes(subgroup.id)}
                                                        onChange={(event) => {
                                                            dispatch({
                                                                type: "toggleSubgroup",
                                                                subgroupId: subgroup.id,
                                                            });
                                                            event.target.blur();
                                                        }}
                                                    />
                                                    <span className="form-check-label">
                                                        {subgroup.title}
                                                        <span className="quizlet-dictionary-word-count">
                                                            {` (${wordsCountBySubgroup.get(subgroup.id) ?? 0})`}
                                                        </span>
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

interface StudentPersonalDictionaryPickerProps {
    student: TQuizletStudentOption;
    query: UseQueryResult<TQuizletPersonalDictionary>;
    selectedSubgroupIds: number[];
    dispatch: Dispatch<AssignmentFormAction>;
}

const StudentPersonalDictionaryPicker = ({
    student,
    query,
    selectedSubgroupIds,
    dispatch,
}: StudentPersonalDictionaryPickerProps) => {
    const subgroups = query.data?.subgroups ?? [];

    return (
        <div className="quizlet-setup-dictionary-card">
            <div className="quizlet-setup-dictionary-toggle">
                {subgroups.length > 0 && (
                    <span className="quizlet-setup-dictionary-toggle-icon" aria-hidden="true">
                        −
                    </span>
                )}
                <span className="fw-bold text-dark quizlet-group-checkbox-title">
                    {student.nickname} ({student.name})
                </span>
                {selectedSubgroupIds.length > 0 && (
                    <span className="quizlet-setup-selected-badge">{selectedSubgroupIds.length} выбрано</span>
                )}
            </div>

            {query.isPending && (
                <div className="text-muted small quizlet-setup-empty-state">Загружаю личные словари ученика...</div>
            )}

            {query.isError && (
                <div className="text-danger small quizlet-setup-empty-state">
                    Не удалось загрузить личные словари ученика
                </div>
            )}

            {query.isSuccess && subgroups.length === 0 && (
                <div className="text-muted small quizlet-setup-empty-state">У ученика пока нет личных словарей</div>
            )}

            {query.isSuccess && subgroups.length > 0 && (
                <div
                    id={`assignment-personal-subgroups-${student.id}`}
                    className="quizlet-setup-topics-collapse is-expanded"
                >
                    <div className="quizlet-setup-topics-collapse-inner">
                        <div className="d-flex flex-wrap gap-2 quizlet-setup-topic-list">
                            {subgroups.map((subgroup) => (
                                <label
                                    key={subgroup.id}
                                    className="form-check me-3 quizlet-topic-checkbox-label quizlet-setup-topic-chip"
                                >
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        checked={selectedSubgroupIds.includes(subgroup.id)}
                                        onChange={(event) => {
                                            dispatch({
                                                type: "togglePersonalSubgroup",
                                                studentId: student.id,
                                                subgroupId: subgroup.id,
                                            });
                                            event.target.blur();
                                        }}
                                    />
                                    <span className="form-check-label">
                                        {subgroup.title}
                                        <span className="quizlet-dictionary-word-count">
                                            {` (${query.data.words.filter((word) => word.subgroup_id === subgroup.id).length})`}
                                        </span>
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const TeacherAssignmentCreatePage = ({ catalog }: { catalog: TQuizletCatalog }) => {
    const queryClient = useQueryClient();
    const [form, dispatch] = useReducer(assignmentFormReducer, initialAssignmentFormState);
    const [error, setError] = useState<string | null>(null);

    const optionsQuery = useQuery(quizletQueries.assignmentOptions());
    const students = optionsQuery.data?.students ?? [];
    const selectedStudents = students.filter((student) => form.studentIds.includes(student.id));

    // Личные словари выбранных учеников (кешируются по ученику).
    const personalQueries = useQueries({
        queries: form.studentIds.map((studentId) => quizletQueries.studentDictionary(studentId)),
    });
    const personalQueryByStudent = new Map(
        form.studentIds.map((studentId, index) => [studentId, personalQueries[index]]),
    );

    const selectedWordsCount = (() => {
        const selectedWordIds = new Set(
            catalog.subgroup_words
                .filter((item) => form.subgroupIds.includes(item.subgroup_id))
                .map((item) => item.word_id),
        );

        let personalWordsCount = 0;
        form.studentIds.forEach((studentId, index) => {
            const dictionary = personalQueries[index]?.data;
            const selectedIds = form.personalSubgroupIdsByStudent[studentId] ?? [];
            if (dictionary === undefined || selectedIds.length === 0) {
                return;
            }
            personalWordsCount += dictionary.words.filter((word) =>
                selectedIds.includes(word.subgroup_id ?? -1),
            ).length;
        });

        return selectedWordIds.size + personalWordsCount;
    })();

    const createMutation = useMutation({
        mutationFn: createQuizletAssignment,
        onSuccess: () => {
            dispatch({ type: "resetAfterCreate" });
            return queryClient.invalidateQueries({ queryKey: quizletKeys.assignments() });
        },
        onError: (mutationError) => setError(getApiErrorMessage(mutationError, "Не удалось назначить задание")),
    });

    const handleCreate = () => {
        setError(null);

        const personalTargets = form.studentIds
            .map((studentId) => ({
                student_id: studentId,
                subgroup_ids: form.personalSubgroupIdsByStudent[studentId] ?? [],
            }))
            .filter((item) => item.subgroup_ids.length > 0);

        if (form.title.trim().length === 0) {
            setError("Укажите название задания");
            return;
        }

        if (form.subgroupIds.length === 0 && personalTargets.length === 0) {
            setError("Выберите хотя бы один словарь");
            return;
        }

        if (form.studentIds.length === 0) {
            setError("Выберите хотя бы одного ученика");
            return;
        }

        createMutation.mutate({
            title: form.title.trim(),
            quiz_type: form.quizType,
            subgroup_ids: form.subgroupIds,
            personal_targets: personalTargets,
            show_hints: form.showHints,
            translation_direction: form.direction,
            student_ids: form.studentIds,
        });
    };

    return (
        <div className="quizlet-main-container">
            <div className="card mb-3">
                <div className="card-body d-flex flex-column gap-3">
                    <div>
                        <input
                            className="form-control"
                            value={form.title}
                            onChange={(event) => dispatch({ type: "setTitle", title: event.target.value })}
                            placeholder="Например: Повторение слов N4"
                        />
                    </div>

                    <div>
                        <div className="row g-2">
                            <QuizTypeOption
                                isSelected={form.quizType === "flashcards"}
                                icon="bi-card-text"
                                title="Карточки"
                                description="Классический формат карточек для запоминания."
                                onSelect={() => dispatch({ type: "setQuizType", quizType: "flashcards" })}
                            />
                            <QuizTypeOption
                                isSelected={form.quizType === "pair"}
                                icon="bi-grid-3x3-gap"
                                title="Пары"
                                description="Соединяй совпадающие пары как можно быстрее."
                                onSelect={() => dispatch({ type: "setQuizType", quizType: "pair" })}
                            />
                        </div>
                    </div>

                    <div className="col-12 col-md-4">
                        <select
                            className="form-select"
                            value={form.direction}
                            onChange={(event) =>
                                dispatch({
                                    type: "setDirection",
                                    direction: event.target.value as "jp_to_ru" | "ru_to_jp",
                                })
                            }
                        >
                            <option value="jp_to_ru">jp → ru</option>
                            <option value="ru_to_jp">ru → jp</option>
                        </select>
                    </div>

                    <label className="form-check d-inline-flex align-items-center gap-2 mb-0">
                        <input
                            className="form-check-input mt-0"
                            type="checkbox"
                            checked={form.showHints}
                            onChange={(event) => dispatch({ type: "setShowHints", showHints: event.target.checked })}
                        />
                        <span className="form-check-label">Показывать чтения</span>
                    </label>

                    <CatalogDictionaryPicker
                        catalog={catalog}
                        selectedSubgroupIds={form.subgroupIds}
                        expandedGroupIds={form.expandedGroupIds}
                        dispatch={dispatch}
                    />

                    <div>
                        <label className="form-label">👻</label>
                        {optionsQuery.isError && (
                            <div className="text-danger small">Не удалось загрузить список учеников</div>
                        )}
                        <div className="d-flex flex-wrap gap-2">
                            {students.map((student) => (
                                <label key={student.id} className="form-check me-3">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        checked={form.studentIds.includes(student.id)}
                                        onChange={() => dispatch({ type: "toggleStudent", studentId: student.id })}
                                    />
                                    <span className="form-check-label">
                                        {student.nickname} ({student.name})
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {selectedStudents.length > 0 && (
                        <div>
                            <label className="form-label mb-2">Личные словари выбранных учеников</label>
                            <div className="d-flex flex-column gap-2">
                                {selectedStudents.map((student) => {
                                    const query = personalQueryByStudent.get(student.id);
                                    return query === undefined ? null : (
                                        <StudentPersonalDictionaryPicker
                                            key={student.id}
                                            student={student}
                                            query={query}
                                            selectedSubgroupIds={form.personalSubgroupIdsByStudent[student.id] ?? []}
                                            dispatch={dispatch}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {error && <div className="text-danger small">{error}</div>}

                    <div className="d-flex align-items-center gap-3 flex-wrap">
                        <button className="btn btn-primary" onClick={handleCreate} disabled={createMutation.isPending}>
                            {createMutation.isPending ? "Сохранение..." : "Сохранить и назначить"}
                        </button>
                        <span className="text-muted small">
                            Слов выбрано: <span className="fw-semibold">{selectedWordsCount}</span>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeacherAssignmentCreatePage;
