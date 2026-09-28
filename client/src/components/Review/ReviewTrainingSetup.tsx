import { Dispatch } from "react";

import { TReviewCatalog } from "api/review";

import { ReviewSetupAction, ReviewSetupState } from "./reviewSetupReducer";
import { REVIEW_RANDOM_SESSION_SIZES, ReviewTrainingMode, TrainingSession } from "./reviewTraining";

const MODE_OPTIONS: Array<{ mode: ReviewTrainingMode; label: string }> = [
    { mode: "topics", label: "По топикам" },
    { mode: "random", label: "Random Review" },
    { mode: "smart_random", label: "Smart Random Review" },
];

const DIRECTION_OPTIONS: Array<{ direction: TrainingSession["direction"]; label: string }> = [
    { direction: "jp_to_ru", label: "jp → ru" },
    { direction: "ru_to_jp", label: "ru → jp" },
];

const toggleButtonClass = (isActive: boolean) =>
    `btn review-direction-button ${isActive ? "btn-success" : "btn-outline-success"}`;

interface TopicsPickerProps {
    catalog: TReviewCatalog;
    selectedTopicIds: number[];
    dispatch: Dispatch<ReviewSetupAction>;
}

const TopicsPicker = ({ catalog, selectedTopicIds, dispatch }: TopicsPickerProps) => (
    <section className="review-training-panel">
        <div className="review-training-section-label">Топики</div>
        <div className="review-training-topic-list">
            {catalog.dictionaries.map((dictionary) => {
                const dictionaryTopics = catalog.topics.filter((topic) => topic.dictionary_id === dictionary.id);
                const dictionaryTopicIds = dictionaryTopics.map((topic) => topic.id);
                const selectedTopicsCount = dictionaryTopicIds.filter((topicId) =>
                    selectedTopicIds.includes(topicId),
                ).length;
                const isDictionarySelected =
                    dictionaryTopicIds.length > 0 && selectedTopicsCount === dictionaryTopicIds.length;
                const dictionaryWordCount = catalog.words.filter((word) =>
                    dictionaryTopicIds.includes(word.topic_id),
                ).length;

                return (
                    <div className="border rounded p-2 mb-2" key={dictionary.id}>
                        <div className="d-flex align-items-center mb-2">
                            <label className="form-check d-inline-flex align-items-center gap-2 mb-0 quizlet-group-checkbox-label">
                                <input
                                    className="form-check-input mt-0"
                                    type="checkbox"
                                    checked={isDictionarySelected}
                                    disabled={dictionaryTopics.length === 0}
                                    ref={(input) => {
                                        if (input !== null) {
                                            input.indeterminate = selectedTopicsCount > 0 && !isDictionarySelected;
                                        }
                                    }}
                                    onChange={(event) => {
                                        dispatch({ type: "toggleDictionaryTopics", topicIds: dictionaryTopicIds });
                                        event.target.blur();
                                    }}
                                />
                                <span className="fw-bold text-dark quizlet-group-checkbox-title">
                                    {dictionary.title}
                                    <span className="quizlet-dictionary-word-count">
                                        {` (${dictionaryTopics.length} тем • ${dictionaryWordCount} карточек)`}
                                    </span>
                                </span>
                            </label>
                        </div>

                        {dictionaryTopics.length === 0 ? (
                            <div className="small text-muted">Нет топиков</div>
                        ) : (
                            <div className="d-flex flex-wrap gap-2">
                                {dictionaryTopics.map((topic) => (
                                    <label key={topic.id} className="form-check me-3 quizlet-topic-checkbox-label">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            checked={selectedTopicIds.includes(topic.id)}
                                            onChange={(event) => {
                                                dispatch({ type: "toggleTopic", topicId: topic.id });
                                                event.target.blur();
                                            }}
                                        />
                                        <span className="form-check-label">
                                            {topic.title}
                                            <span className="quizlet-dictionary-word-count">
                                                {` (${catalog.words.filter((word) => word.topic_id === topic.id).length})`}
                                            </span>
                                        </span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    </section>
);

interface ReviewTrainingSetupProps {
    catalog: TReviewCatalog;
    setup: ReviewSetupState;
    dispatch: Dispatch<ReviewSetupAction>;
    memoryStateError: string | null;
    onStart: () => void;
}

const ReviewTrainingSetup = ({ catalog, setup, dispatch, memoryStateError, onStart }: ReviewTrainingSetupProps) => {
    const nonFrozenWordsCount = catalog.words.filter((word) => !word.is_frozen).length;
    const trainingWordCount =
        setup.mode === "topics"
            ? catalog.words.filter((word) => setup.selectedTopicIds.includes(word.topic_id)).length
            : Math.min(setup.randomCount, nonFrozenWordsCount);

    return (
        <>
            <section className="review-training-panel">
                <div className="review-training-mode-toggle">
                    {MODE_OPTIONS.map((option) => (
                        <button
                            key={option.mode}
                            type="button"
                            className={toggleButtonClass(setup.mode === option.mode)}
                            onClick={() => dispatch({ type: "setMode", mode: option.mode })}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>

                <div className="review-direction-toggle">
                    {DIRECTION_OPTIONS.map((option) => (
                        <button
                            key={option.direction}
                            type="button"
                            className={toggleButtonClass(setup.direction === option.direction)}
                            onClick={() => dispatch({ type: "setDirection", direction: option.direction })}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>

                <div className="form-check mt-3 mb-0">
                    <input
                        className="form-check-input"
                        id="reviewSpeakJpAfterFlip"
                        type="checkbox"
                        checked={setup.speakJpAfterFlip}
                        onChange={(event) => {
                            dispatch({ type: "setSpeakJpAfterFlip", enabled: event.target.checked });
                            event.target.blur();
                        }}
                    />
                    <label className="form-check-label" htmlFor="reviewSpeakJpAfterFlip">
                        Озвучка после переворота (jp)
                    </label>
                </div>

                <div className="form-check mt-2 mb-0">
                    <input
                        className="form-check-input"
                        id="reviewAutoSpeakCards"
                        type="checkbox"
                        checked={setup.autoSpeakCards}
                        onChange={(event) => {
                            dispatch({ type: "setAutoSpeakCards", enabled: event.target.checked });
                            event.target.blur();
                        }}
                    />
                    <label className="form-check-label" htmlFor="reviewAutoSpeakCards">
                        Автоозвучка
                    </label>
                </div>

                {memoryStateError && <div className="alert alert-warning mt-3 mb-0">{memoryStateError}</div>}
            </section>

            {setup.mode === "topics" ? (
                <TopicsPicker catalog={catalog} selectedTopicIds={setup.selectedTopicIds} dispatch={dispatch} />
            ) : (
                <section className="review-training-panel">
                    <div className="review-training-section-label">
                        {setup.mode === "random" ? "Random Review" : "Smart Random Review"}
                    </div>
                    <div className="review-random-size-list" role="radiogroup" aria-label="Размер сессии">
                        {REVIEW_RANDOM_SESSION_SIZES.map((size) => (
                            <button
                                key={size}
                                type="button"
                                className={`btn ${setup.randomCount === size ? "btn-success" : "btn-outline-success"}`}
                                onClick={() => dispatch({ type: "setRandomCount", count: size })}
                            >
                                {size}
                            </button>
                        ))}
                    </div>
                    <div className="small text-muted mt-3">
                        {setup.mode === "random"
                            ? "Случайная сессия берёт слова из всех незамороженных карточек."
                            : "Smart Random Review смешивает незамороженные слова как 60% shaky, 35% passive и 5% active с добором из оставшихся слов при нехватке."}
                    </div>
                    <div className="review-random-summary mt-3">
                        Доступно незамороженных карточек: <strong>{nonFrozenWordsCount}</strong>
                    </div>
                </section>
            )}

            <section className="review-training-panel review-training-panel-start">
                <div className="review-training-start-row">
                    <button
                        type="button"
                        className="btn btn-success review-training-start-button"
                        disabled={trainingWordCount === 0}
                        onClick={onStart}
                    >
                        Начать тренировку
                    </button>
                    <div className="review-training-selected-count">
                        {setup.mode === "topics" ? "Выбрано карточек:" : "Размер сессии:"}{" "}
                        <span>{trainingWordCount}</span>
                    </div>
                </div>
            </section>
        </>
    );
};

export default ReviewTrainingSetup;
