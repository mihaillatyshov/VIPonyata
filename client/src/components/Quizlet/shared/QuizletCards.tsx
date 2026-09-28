import { ReactNode } from "react";

export const QuizletCardGrid = ({ children }: { children: ReactNode }) => (
    <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-2 pt-1">{children}</div>
);

interface QuizletTopicCardProps {
    title: ReactNode;
    /** Строка под заголовком (количество слов/тем). */
    meta: ReactNode;
    isTitleBold?: boolean;
    onClick: () => void;
}

/** Карточка-кнопка урока/темы/словаря в сетке `QuizletCardGrid`. */
export const QuizletTopicCard = ({ title, meta, isTitleBold = false, onClick }: QuizletTopicCardProps) => (
    <div className="col">
        <button type="button" className="btn w-100 text-start p-0 border-0 quizlet-topic-card-btn" onClick={onClick}>
            <div className="card quizlet-topic-card h-100">
                <div className="card-body d-flex flex-column justify-content-between">
                    <span className={`quizlet-topic-card__title${isTitleBold ? " fw-semibold" : ""}`}>{title}</span>
                    <span className="quizlet-topic-card__count text-muted mt-2">{meta}</span>
                </div>
            </div>
        </button>
    </div>
);

export const WordsCountMeta = ({ count, label = "слов" }: { count: number; label?: string }) => (
    <>
        <i className="bi bi-card-text me-1" />
        {count} {label}
    </>
);

export const TopicsAndWordsCountMeta = ({
    topicsCount,
    wordsCount,
    wordsLabel = "слов",
}: {
    topicsCount: number;
    wordsCount: number;
    wordsLabel?: string;
}) => (
    <>
        <i className="bi bi-collection me-1" />
        {topicsCount} тем
        <span className="mx-2">•</span>
        <WordsCountMeta count={wordsCount} label={wordsLabel} />
    </>
);
