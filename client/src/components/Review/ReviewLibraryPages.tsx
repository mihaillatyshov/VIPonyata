import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    createReviewDictionary,
    createReviewTopic,
    createReviewWord,
    deleteReviewDictionary,
    deleteReviewTopic,
    deleteReviewWord,
    reviewKeys,
    reviewQueries,
    TReviewCatalog,
    updateReviewDictionary,
    updateReviewTopic,
    updateReviewWord,
} from "api/review";
import ConfirmDeleteButton from "components/Quizlet/shared/ConfirmDeleteButton";
import InlineEditableTitle from "components/Quizlet/shared/InlineEditableTitle";
import QuizletBreadcrumb from "components/Quizlet/shared/QuizletBreadcrumb";
import {
    QuizletCardGrid,
    QuizletTopicCard,
    TopicsAndWordsCountMeta,
    WordsCountMeta,
} from "components/Quizlet/shared/QuizletCards";
import { TReviewDictionary, TReviewTopic } from "models/TReview";

import { useQueryClient } from "@tanstack/react-query";

import { REVIEW_ROUTE_PATHS } from "./reviewRoutes";
import ReviewTopicEditor, { ReviewWordsChanges } from "./ReviewTopicEditor";
import { normalizeText } from "./reviewTraining";

const useRefreshReviewCatalog = () => {
    const queryClient = useQueryClient();
    return () => queryClient.invalidateQueries({ queryKey: reviewKeys.catalog() });
};

const CreateItemRow = ({
    placeholder,
    onCreate,
}: {
    placeholder: string;
    onCreate: (title: string) => Promise<unknown>;
}) => {
    const [title, setTitle] = useState("");

    const handleCreate = async () => {
        const normalizedTitle = normalizeText(title);
        if (!normalizedTitle) {
            return;
        }
        await onCreate(normalizedTitle);
        setTitle("");
    };

    return (
        <div className="mb-3 d-flex gap-2 align-items-center quizlet-personal-topic-create-row">
            <input
                className="form-control quizlet-personal-topic-create-input"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder={placeholder}
                onKeyDown={(event) => {
                    if (event.key === "Enter") {
                        handleCreate();
                    }
                }}
            />
            <button
                type="button"
                className="btn btn-success btn-sm quizlet-personal-topic-create-btn"
                onClick={handleCreate}
            >
                + Добавить
            </button>
        </div>
    );
};

export const ReviewDictionariesPage = ({ catalog }: { catalog: TReviewCatalog }) => {
    const navigate = useNavigate();
    const refreshCatalog = useRefreshReviewCatalog();
    const { dictionaries, topics, words } = catalog;

    return (
        <div className="review-section-card review-library-container">
            <CreateItemRow
                placeholder="Новый словарь..."
                onCreate={async (title) => {
                    await createReviewDictionary(title);
                    await refreshCatalog();
                }}
            />

            {dictionaries.length === 0 ? (
                <div className="text-muted">Пока нет словарей. Создайте первый.</div>
            ) : (
                <QuizletCardGrid>
                    {dictionaries.map((dictionary) => {
                        const topicIds = new Set(
                            topics.filter((topic) => topic.dictionary_id === dictionary.id).map((topic) => topic.id),
                        );
                        return (
                            <QuizletTopicCard
                                key={dictionary.id}
                                title={dictionary.title}
                                isTitleBold
                                meta={
                                    <TopicsAndWordsCountMeta
                                        topicsCount={topicIds.size}
                                        wordsCount={words.filter((word) => topicIds.has(word.topic_id)).length}
                                        wordsLabel="карточек"
                                    />
                                }
                                onClick={() => navigate(REVIEW_ROUTE_PATHS.dictionary(dictionary.id))}
                            />
                        );
                    })}
                </QuizletCardGrid>
            )}
        </div>
    );
};

export const ReviewDictionaryPage = ({
    catalog,
    dictionary,
}: {
    catalog: TReviewCatalog;
    dictionary: TReviewDictionary;
}) => {
    const navigate = useNavigate();
    const refreshCatalog = useRefreshReviewCatalog();
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const dictionaryTopics = catalog.topics.filter((topic) => topic.dictionary_id === dictionary.id);

    const removeDictionary = async () => {
        await deleteReviewDictionary(dictionary.id);
        navigate(REVIEW_ROUTE_PATHS.root);
        await refreshCatalog();
    };

    return (
        <div className="review-section-card review-library-container">
            <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
                <QuizletBreadcrumb
                    items={[
                        { key: "root", label: "復習", to: REVIEW_ROUTE_PATHS.root },
                        {
                            key: "dictionary",
                            label: (
                                <InlineEditableTitle
                                    title={dictionary.title}
                                    isEditing={isEditingTitle}
                                    onEditingChange={setIsEditingTitle}
                                    onRename={async (title) => {
                                        await updateReviewDictionary(dictionary.id, title, dictionary.sort);
                                        await refreshCatalog();
                                    }}
                                    editButtonTitle="Переименовать словарь"
                                />
                            ),
                            active: !isEditingTitle,
                        },
                    ]}
                />

                <div className="d-flex gap-2 align-items-center quizlet-personal-topic-header-actions">
                    <ConfirmDeleteButton label="Удалить словарь" onConfirm={removeDictionary} />
                </div>
            </div>

            <CreateItemRow
                placeholder="Новая тема..."
                onCreate={async (title) => {
                    await createReviewTopic(dictionary.id, title);
                    await refreshCatalog();
                }}
            />

            {dictionaryTopics.length === 0 ? (
                <div className="text-muted">В этом словаре пока нет топиков.</div>
            ) : (
                <QuizletCardGrid>
                    {dictionaryTopics.map((topic) => (
                        <QuizletTopicCard
                            key={topic.id}
                            title={topic.title}
                            meta={
                                <WordsCountMeta
                                    count={catalog.words.filter((word) => word.topic_id === topic.id).length}
                                    label="карточек"
                                />
                            }
                            onClick={() => navigate(REVIEW_ROUTE_PATHS.topic(topic.id))}
                        />
                    ))}
                </QuizletCardGrid>
            )}
        </div>
    );
};

export const ReviewTopicPage = ({ catalog, topic }: { catalog: TReviewCatalog; topic: TReviewTopic }) => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const refreshCatalog = useRefreshReviewCatalog();
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const dictionaryTitle = catalog.dictionaries.find((item) => item.id === topic.dictionary_id)?.title ?? "Словарь";

    const removeTopic = async () => {
        await deleteReviewTopic(topic.id);
        navigate(REVIEW_ROUTE_PATHS.dictionary(topic.dictionary_id));
        await refreshCatalog();
    };

    const saveWords = async (changes: ReviewWordsChanges) => {
        for (const wordId of changes.deletedIds) {
            await deleteReviewWord(wordId);
        }
        for (const word of changes.created) {
            await createReviewWord(topic.id, word);
        }
        for (const { id, ...word } of changes.updated) {
            await updateReviewWord(id, word);
        }

        const fresh = await queryClient.fetchQuery({ ...reviewQueries.catalog(), staleTime: 0 });
        return fresh.words.filter((word) => word.topic_id === topic.id);
    };

    return (
        <div className="review-section-card">
            <div className="d-grid gap-3">
                <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
                    <QuizletBreadcrumb
                        items={[
                            { key: "root", label: "復習", to: REVIEW_ROUTE_PATHS.root },
                            {
                                key: "dictionary",
                                label: dictionaryTitle,
                                to: REVIEW_ROUTE_PATHS.dictionary(topic.dictionary_id),
                            },
                            {
                                key: "topic",
                                label: (
                                    <InlineEditableTitle
                                        title={topic.title}
                                        isEditing={isEditingTitle}
                                        onEditingChange={setIsEditingTitle}
                                        onRename={async (title) => {
                                            await updateReviewTopic(topic.id, title, topic.sort);
                                            await refreshCatalog();
                                        }}
                                        editButtonTitle="Переименовать топик"
                                    />
                                ),
                                active: !isEditingTitle,
                            },
                        ]}
                    />

                    <div className="d-flex gap-2 align-items-center quizlet-personal-topic-header-actions">
                        <ConfirmDeleteButton label="Удалить топик" onConfirm={removeTopic} />
                    </div>
                </div>

                <ReviewTopicEditor
                    key={topic.id}
                    initialWords={catalog.words.filter((word) => word.topic_id === topic.id)}
                    onSave={saveWords}
                />
            </div>
        </div>
    );
};
