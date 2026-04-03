import { formatDuration } from "./quizletUtils";

import "./TrainingSessionHeader.css";

interface TrainingSessionHeaderProps {
    incorrectAnswers: number;
    elapsedSeconds: number;
    currentPosition: number;
    totalWords: number;
    currentPage?: number;
    totalPages?: number;
    onFinishTraining: () => void;
}

const TrainingSessionHeader = ({
    incorrectAnswers,
    elapsedSeconds,
    currentPosition,
    totalWords,
    currentPage,
    totalPages,
    onFinishTraining,
}: TrainingSessionHeaderProps) => {
    const isPageMode = currentPage !== undefined && totalPages !== undefined && totalPages > 0;
    const tooltipText = isPageMode ? `${currentPage} из ${totalPages} страниц` : undefined;

    return (
        <div className="flashcard-card-header">
            <div className="flashcard-header-side flashcard-header-left">
                <div className="flashcard-meta">
                    <span className="flashcard-error-badge" title="Ошибки">
                        <i className="bi bi-exclamation-circle" />
                        <span>{incorrectAnswers}</span>
                    </span>
                    <span className="flashcard-time" title="Время">
                        <i className="bi bi-clock" />
                        <span>{formatDuration(elapsedSeconds)}</span>
                    </span>
                </div>
            </div>
            <div className="flashcard-position">
                {isPageMode ? (
                    <span title={tooltipText}>
                        {currentPage} / {totalPages}
                    </span>
                ) : (
                    <>
                        {Math.max(1, currentPosition)} / {totalWords}
                    </>
                )}
            </div>
            <div className="flashcard-header-side flashcard-header-right">
                <button type="button" className="training-finish-btn" onClick={onFinishTraining}>
                    Завершить
                </button>
            </div>
        </div>
    );
};

export default TrainingSessionHeader;
