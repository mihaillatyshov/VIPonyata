import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    createQuizletStudentSubgroup,
    deleteQuizletStudentSubgroup,
    quizletKeys,
    quizletQueries,
    renameQuizletStudentSubgroup,
    saveQuizletStudentLesson,
    saveQuizletStudentWordsBatch,
    TQuizletPersonalDictionary,
    TQuizletStudentCard,
} from "api/quizlet";
import { TQuizletSubgroup } from "models/TQuizlet";

import { useQueryClient } from "@tanstack/react-query";

import ConfirmDeleteButton from "../shared/ConfirmDeleteButton";
import QuizletBreadcrumb from "../shared/QuizletBreadcrumb";
import { QuizletCardGrid, QuizletTopicCard, WordsCountMeta } from "../shared/QuizletCards";
import QuizletWordsEditor, { QuizletWordsChanges } from "../shared/QuizletWordsEditor";
import { teacherQuizletPaths } from "./useTeacherQuizletView";

/** Поле названия, которое сохраняется при потере фокуса (если изменилось). */
const TitleOnBlurInput = ({
    initialTitle,
    onSave,
    style,
}: {
    initialTitle: string;
    onSave: (title: string) => void;
    style?: React.CSSProperties;
}) => {
    const [draft, setDraft] = useState(initialTitle);

    return (
        <input
            className="form-control"
            style={style}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={() => {
                const title = draft.trim();
                if (title.length > 0 && title !== initialTitle) {
                    onSave(title);
                }
            }}
        />
    );
};

const CreateLessonForm = ({ onCreate }: { onCreate: (title: string) => void }) => {
    const [title, setTitle] = useState("");

    return (
        <div className="d-flex gap-2 mb-3" style={{ width: "min(100%, 520px)" }}>
            <input
                className="form-control"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Название словаря ученика"
            />
            <button
                className="btn btn-outline-primary"
                onClick={() => {
                    if (title.trim().length > 0) {
                        onCreate(title.trim());
                    }
                }}
            >
                Создать
            </button>
        </div>
    );
};

const CreateTopicForm = ({ onCreate }: { onCreate: (title: string) => Promise<unknown> }) => {
    const [title, setTitle] = useState("");

    const handleCreate = async () => {
        if (title.trim().length === 0) {
            return;
        }
        await onCreate(title.trim());
        setTitle("");
    };

    return (
        <div className="mb-3 d-flex gap-2 align-items-center quizlet-personal-topic-create-row">
            <input
                className="form-control quizlet-personal-topic-create-input"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Новая тема..."
                onKeyDown={(event) => {
                    if (event.key === "Enter") {
                        handleCreate();
                    }
                }}
            />
            <button className="btn btn-success btn-sm quizlet-personal-topic-create-btn" onClick={handleCreate}>
                + Добавить
            </button>
        </div>
    );
};

interface StudentDictionaryDetailsProps {
    studentId: number;
    student: TQuizletStudentCard | null;
    dictionary: TQuizletPersonalDictionary;
    topicId?: number;
    onToggleHidden: (student: TQuizletStudentCard) => void;
}

const StudentDictionaryDetails = ({
    studentId,
    student,
    dictionary,
    topicId,
    onToggleHidden,
}: StudentDictionaryDetailsProps) => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { lesson, subgroups, words } = dictionary;
    const selectedSubgroup = subgroups.find((subgroup) => subgroup.id === topicId) ?? null;
    const studentLabel = student?.nickname ?? `Ученик #${studentId}`;

    const refreshDictionary = () =>
        queryClient.invalidateQueries({ queryKey: quizletKeys.studentDictionary(studentId) });

    const saveLessonTitle = async (title: string) => {
        await saveQuizletStudentLesson(studentId, title, lesson === null);
        await refreshDictionary();
    };

    const createSubgroup = async (title: string) => {
        const response = await createQuizletStudentSubgroup(studentId, title);
        await refreshDictionary();
        navigate(teacherQuizletPaths.studentTopic(studentId, response.subgroup.id));
    };

    const renameSubgroup = async (subgroup: TQuizletSubgroup, title: string) => {
        await renameQuizletStudentSubgroup(studentId, subgroup.id, title);
        await refreshDictionary();
    };

    const deleteSubgroup = async (subgroup: TQuizletSubgroup) => {
        await deleteQuizletStudentSubgroup(studentId, subgroup.id);
        navigate(teacherQuizletPaths.studentDictionary(studentId));
        await refreshDictionary();
    };

    const saveWords = async (subgroup: TQuizletSubgroup, changes: QuizletWordsChanges) => {
        await saveQuizletStudentWordsBatch(studentId, subgroup.id, {
            deleted_ids: changes.deletedIds,
            created: changes.created.map((word) => ({ ...word, subgroup_id: subgroup.id })),
            updated: changes.updated,
        });
        const fresh = await queryClient.fetchQuery({ ...quizletQueries.studentDictionary(studentId), staleTime: 0 });
        return fresh.words.filter((word) => word.subgroup_id === subgroup.id);
    };

    return (
        <>
            <QuizletBreadcrumb
                className="mb-3 quizlet-teacher-breadcrumb quizlet-student-view-breadcrumb"
                items={[
                    { key: "root", label: "Словари учеников", to: teacherQuizletPaths.studentsDictionaries },
                    {
                        key: "student",
                        label: studentLabel,
                        to: topicId !== undefined ? teacherQuizletPaths.studentDictionary(studentId) : undefined,
                        active: topicId === undefined,
                    },
                    ...(topicId !== undefined
                        ? [{ key: "topic", label: selectedSubgroup?.title ?? `Тема #${topicId}`, active: true }]
                        : []),
                ]}
            />

            <div className="mb-3 d-flex align-items-center justify-content-between gap-2 flex-wrap">
                <div className="fw-semibold">{student?.name ?? ""}</div>
                {student !== null && (
                    <button
                        className={`btn btn-sm ${student.is_hidden ? "btn-outline-primary" : "btn-outline-secondary"}`}
                        onClick={() => onToggleHidden(student)}
                    >
                        {student.is_hidden ? "Показать ученика" : "Скрыть ученика"}
                    </button>
                )}
            </div>

            {lesson === null && <CreateLessonForm onCreate={saveLessonTitle} />}

            {lesson !== null && topicId === undefined && (
                <>
                    <div className="d-flex gap-2 mb-3" style={{ width: "min(100%, 560px)" }}>
                        <TitleOnBlurInput key={lesson.title} initialTitle={lesson.title} onSave={saveLessonTitle} />
                    </div>

                    <CreateTopicForm onCreate={createSubgroup} />

                    {subgroups.length === 0 && <div className="text-muted">Тем пока нет</div>}
                    {subgroups.length > 0 && (
                        <QuizletCardGrid>
                            {subgroups.map((subgroup) => (
                                <QuizletTopicCard
                                    key={subgroup.id}
                                    title={subgroup.title}
                                    meta={
                                        <WordsCountMeta
                                            count={words.filter((word) => word.subgroup_id === subgroup.id).length}
                                        />
                                    }
                                    onClick={() => navigate(teacherQuizletPaths.studentTopic(studentId, subgroup.id))}
                                />
                            ))}
                        </QuizletCardGrid>
                    )}
                </>
            )}

            {lesson !== null && selectedSubgroup !== null && (
                <>
                    <div className="d-flex justify-content-between align-items-center gap-2 mb-3">
                        <TitleOnBlurInput
                            key={`${selectedSubgroup.id}:${selectedSubgroup.title}`}
                            initialTitle={selectedSubgroup.title}
                            onSave={(title) => renameSubgroup(selectedSubgroup, title)}
                            style={{ maxWidth: "520px" }}
                        />
                        <div className="d-flex gap-2">
                            <ConfirmDeleteButton
                                key={selectedSubgroup.id}
                                label="Удалить тему"
                                className="btn btn-outline-danger"
                                onConfirm={() => deleteSubgroup(selectedSubgroup)}
                            />
                        </div>
                    </div>

                    <QuizletWordsEditor
                        key={selectedSubgroup.id}
                        initialWords={words.filter((word) => word.subgroup_id === selectedSubgroup.id)}
                        onSave={(changes) => saveWords(selectedSubgroup, changes)}
                        checkReadingDuplicates
                    />
                </>
            )}
        </>
    );
};

export default StudentDictionaryDetails;
