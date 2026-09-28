import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    createQuizletPersonalSubgroup,
    createQuizletPersonalWord,
    deleteQuizletPersonalSubgroup,
    deleteQuizletPersonalWord,
    quizletKeys,
    quizletQueries,
    renameQuizletPersonalSubgroup,
    saveQuizletPersonalLesson,
    TQuizletPersonalDictionary,
    updateQuizletPersonalWord,
} from "api/quizlet";
import { TQuizletSubgroup } from "models/TQuizlet";

import { useQueryClient } from "@tanstack/react-query";

import ConfirmDeleteButton from "../shared/ConfirmDeleteButton";
import InlineEditableTitle from "../shared/InlineEditableTitle";
import QuizletBreadcrumb from "../shared/QuizletBreadcrumb";
import { QuizletCardGrid, QuizletTopicCard, WordsCountMeta } from "../shared/QuizletCards";
import QuizletWordsEditor, { QuizletWordsChanges } from "../shared/QuizletWordsEditor";
import StudentDictionaryTabs from "./StudentDictionaryTabs";
import { studentQuizletPaths } from "./studentQuizletRoutes";

const DEFAULT_LESSON_TITLE = "Мой словарь";

const CreateLessonForm = ({ onCreate }: { onCreate: (title: string) => Promise<unknown> }) => {
    const [title, setTitle] = useState(DEFAULT_LESSON_TITLE);

    const handleCreate = () => {
        if (title.trim().length > 0) {
            onCreate(title);
        }
    };

    return (
        <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
            <div className="flex-grow-1" style={{ minWidth: 0 }}>
                <div className="d-flex gap-2 flex-grow-1">
                    <input
                        className="form-control"
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        placeholder="Например: Мой словарь"
                        autoFocus
                        onKeyDown={(event) => {
                            if (event.key === "Enter") handleCreate();
                            if (event.key === "Escape") setTitle("");
                        }}
                    />
                    <button className="btn btn-outline-primary" onClick={handleCreate}>
                        Создать
                    </button>
                </div>
            </div>
        </div>
    );
};

const CreateTopicForm = ({ onCreate }: { onCreate: (title: string) => Promise<unknown> }) => {
    const [title, setTitle] = useState("");

    const handleCreate = async () => {
        if (title.trim().length === 0) {
            return;
        }
        await onCreate(title);
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
                    if (event.key === "Enter") handleCreate();
                }}
            />
            <button className="btn btn-success btn-sm quizlet-personal-topic-create-btn" onClick={handleCreate}>
                + Добавить
            </button>
        </div>
    );
};

interface PersonalDictionaryPageProps {
    dictionary: TQuizletPersonalDictionary;
    topicId: number | null;
}

/** «Мой словарь» ученика: название словаря, темы и редактор слов темы. */
const PersonalDictionaryPage = ({ dictionary, topicId }: PersonalDictionaryPageProps) => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { lesson, subgroups, words } = dictionary;
    const [isEditingLessonTitle, setIsEditingLessonTitle] = useState(false);
    const [isEditingTopicTitle, setIsEditingTopicTitle] = useState(false);

    const selectedSubgroup = topicId !== null ? (subgroups.find((subgroup) => subgroup.id === topicId) ?? null) : null;

    const refreshPersonal = () => queryClient.invalidateQueries({ queryKey: quizletKeys.personal() });

    const saveLessonTitle = async (title: string) => {
        await saveQuizletPersonalLesson(title, lesson === null);
        await refreshPersonal();
    };

    const createTopic = async (title: string) => {
        const response = await createQuizletPersonalSubgroup(title);
        await refreshPersonal();
        if (response.subgroup?.id !== undefined) {
            navigate(studentQuizletPaths.personalTopic(response.subgroup.id));
        }
    };

    const renameTopic = async (subgroup: TQuizletSubgroup, title: string) => {
        await renameQuizletPersonalSubgroup(subgroup.id, title);
        await refreshPersonal();
    };

    const deleteTopic = async (subgroup: TQuizletSubgroup) => {
        await deleteQuizletPersonalSubgroup(subgroup.id);
        navigate(studentQuizletPaths.personalDictionary);
        await refreshPersonal();
    };

    const saveTopicWords = async (subgroup: TQuizletSubgroup, changes: QuizletWordsChanges) => {
        for (const wordId of changes.deletedIds) {
            await deleteQuizletPersonalWord(wordId);
        }
        for (const word of changes.created) {
            await createQuizletPersonalWord(subgroup.id, word);
        }
        for (const { id, ...word } of changes.updated) {
            await updateQuizletPersonalWord(id, word);
        }

        const fresh = await queryClient.fetchQuery({ ...quizletQueries.personal(), staleTime: 0 });
        return fresh.words.filter((word) => word.subgroup_id === subgroup.id);
    };

    return (
        <div className="quizlet-personal-dictionary-page quizlet-student-dictionary-page">
            <StudentDictionaryTabs active="personal" />

            <div className="quizlet-main-container">
                {lesson === null && <CreateLessonForm onCreate={saveLessonTitle} />}

                {lesson !== null && (
                    <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
                        <QuizletBreadcrumb
                            items={[
                                {
                                    key: "lesson",
                                    label:
                                        topicId === null ? (
                                            <InlineEditableTitle
                                                title={lesson.title}
                                                isEditing={isEditingLessonTitle}
                                                onEditingChange={setIsEditingLessonTitle}
                                                onRename={saveLessonTitle}
                                                placeholder="Например: Мой словарь"
                                            />
                                        ) : (
                                            lesson.title
                                        ),
                                    to: topicId !== null ? studentQuizletPaths.personalDictionary : undefined,
                                    active: topicId === null && !isEditingLessonTitle,
                                },
                                ...(selectedSubgroup !== null
                                    ? [
                                          {
                                              key: "topic",
                                              label: (
                                                  <InlineEditableTitle
                                                      key={selectedSubgroup.id}
                                                      title={selectedSubgroup.title}
                                                      isEditing={isEditingTopicTitle}
                                                      onEditingChange={setIsEditingTopicTitle}
                                                      onRename={(title) => renameTopic(selectedSubgroup, title)}
                                                      editButtonTitle="Переименовать тему"
                                                  />
                                              ),
                                              active: !isEditingTopicTitle,
                                          },
                                      ]
                                    : []),
                            ]}
                        />

                        <div className="d-flex gap-2 align-items-center quizlet-personal-topic-header-actions">
                            {selectedSubgroup !== null && (
                                <ConfirmDeleteButton
                                    key={selectedSubgroup.id}
                                    label="Удалить"
                                    onConfirm={() => deleteTopic(selectedSubgroup)}
                                />
                            )}
                        </div>
                    </div>
                )}

                {lesson !== null && topicId === null && (
                    <>
                        <CreateTopicForm onCreate={createTopic} />

                        {subgroups.length === 0 && (
                            <div className="text-muted">Тем пока нет. Добавьте первую тему.</div>
                        )}

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
                                        onClick={() => navigate(studentQuizletPaths.personalTopic(subgroup.id))}
                                    />
                                ))}
                            </QuizletCardGrid>
                        )}
                    </>
                )}

                {lesson !== null && selectedSubgroup !== null && (
                    <QuizletWordsEditor
                        key={selectedSubgroup.id}
                        initialWords={words.filter((word) => word.subgroup_id === selectedSubgroup.id)}
                        onSave={(changes) => saveTopicWords(selectedSubgroup, changes)}
                        checkReadingDuplicates
                    />
                )}
            </div>
        </div>
    );
};

export default PersonalDictionaryPage;
