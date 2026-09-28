import { TQuizletSessionWithQueue } from "api/quizlet";

import FlashcardExercise from "../FlashcardExercise";
import MatchingExercise from "../MatchingExercise";
import QuizletSessionResults from "../QuizletSessionResults";
import TrainingSessionHeader from "../TrainingSessionHeader";
import { QuizletSessionState } from "./useQuizletSession";

const MATCHING_PAGE_SIZE = 12;

interface QuizletTrainingSessionProps {
    session: TQuizletSessionWithQueue;
    state: QuizletSessionState;
    onFinish: () => void;
}

/** Идущая тренировка (карточки или пары) либо её результаты. */
const QuizletTrainingSession = ({ session, state, onFinish }: QuizletTrainingSessionProps) => {
    const matchingTotalPages = Math.max(1, Math.ceil(session.total_words / MATCHING_PAGE_SIZE));
    const matchingCurrentPage = Math.min(
        matchingTotalPages,
        Math.floor(session.correct_answers / MATCHING_PAGE_SIZE) + 1,
    );

    const header = (
        <TrainingSessionHeader
            incorrectAnswers={session.incorrect_answers}
            elapsedSeconds={state.liveElapsedSeconds}
            currentPosition={session.correct_answers}
            totalWords={session.total_words}
            currentPage={session.quiz_type === "pair" ? matchingCurrentPage : 1}
            totalPages={session.quiz_type === "pair" ? matchingTotalPages : 1}
            onFinishTraining={state.endNow}
        />
    );

    return (
        <div className="quizlet-session-shell p-3 ">
            {!session.is_finished && session.quiz_type !== "flashcards" && session.quiz_type !== "pair" && (
                <div className="mb-3">
                    <div className="training-session-header-shell">{header}</div>
                </div>
            )}

            {!session.is_finished && session.quiz_type === "pair" && (
                <div className="quizlet-main-container matching-session-wrapper">
                    <div className="matching-session-header">{header}</div>
                    <MatchingExercise
                        words={state.orderedSessionWords}
                        showHints={session.show_hints}
                        onAttempt={state.submitPairAttempt}
                    />
                </div>
            )}

            {!session.is_finished && session.quiz_type === "flashcards" && (
                <FlashcardExercise
                    words={state.orderedSessionWords}
                    queue={state.queue}
                    showHints={session.show_hints}
                    direction={session.translation_direction}
                    autoSpeakAfterFlip={state.autoSpeakAfterFlip}
                    onAutoSpeakAfterFlipChange={state.setAutoSpeakAfterFlip}
                    totalWords={session.total_words}
                    unresolvedCount={state.unresolvedCount}
                    incorrectAnswers={session.incorrect_answers}
                    elapsedSeconds={state.liveElapsedSeconds}
                    onFinishTraining={state.endNow}
                    onWordVisible={state.markFlashcardVisible}
                    onAnswer={state.submitFlashcard}
                />
            )}

            {session.is_finished && (
                <QuizletSessionResults
                    correct={session.correct_answers}
                    incorrect={session.incorrect_answers}
                    skipped={session.skipped_words}
                    totalWords={session.total_words}
                    elapsedSeconds={session.elapsed_seconds}
                    onRetryAll={state.retryAll}
                    onRetryIncorrect={state.retryIncorrect}
                    onFinish={onFinish}
                />
            )}
        </div>
    );
};

export default QuizletTrainingSession;
