import { useLocation } from "react-router-dom";

export const studentQuizletPaths = {
    modeSelection: "/quizlet",
    setup: "/quizlet/setup",
    flashcards: "/quizlet/flashcards",
    pairs: "/quizlet/pairs",
    results: "/quizlet/results",
    view: "/quizlet/view",
    viewLesson: (lessonId: number) => `/quizlet/view/lessons/${lessonId}`,
    viewTopic: (lessonId: number, topicId: number) => `/quizlet/view/lessons/${lessonId}/topics/${topicId}`,
    personalDictionary: "/quizlet/my-dictionary",
    personalTopic: (topicId: number) => `/quizlet/my-dictionary/topics/${topicId}`,
    progress: "/quizlet/progress",
} as const;

export type StudentQuizletRoute =
    | { kind: "mode-selection" }
    | { kind: "setup" }
    | { kind: "flashcards" }
    | { kind: "pairs" }
    | { kind: "results" }
    /** Словари учителя: список уроков, темы урока или слова темы. */
    | { kind: "view"; lessonId: number | null; topicId: number | null }
    | { kind: "personal"; topicId: number | null }
    | { kind: "progress" }
    | { kind: "assignment"; assignmentId: number }
    | { kind: "unknown" };

const parseStudentQuizletRoute = (pathname: string): StudentQuizletRoute => {
    switch (pathname) {
        case studentQuizletPaths.modeSelection:
            return { kind: "mode-selection" };
        case studentQuizletPaths.setup:
            return { kind: "setup" };
        case studentQuizletPaths.flashcards:
            return { kind: "flashcards" };
        case studentQuizletPaths.pairs:
            return { kind: "pairs" };
        case studentQuizletPaths.results:
            return { kind: "results" };
        case studentQuizletPaths.view:
            return { kind: "view", lessonId: null, topicId: null };
        case studentQuizletPaths.personalDictionary:
            return { kind: "personal", topicId: null };
        case studentQuizletPaths.progress:
            return { kind: "progress" };
    }

    const viewMatch = pathname.match(/^\/quizlet\/view\/lessons\/(\d+)(?:\/topics\/(\d+))?$/);
    if (viewMatch !== null) {
        return { kind: "view", lessonId: Number(viewMatch[1]), topicId: viewMatch[2] ? Number(viewMatch[2]) : null };
    }

    const personalTopicMatch = pathname.match(/^\/quizlet\/my-dictionary\/topics\/(\d+)$/);
    if (personalTopicMatch !== null) {
        return { kind: "personal", topicId: Number(personalTopicMatch[1]) };
    }

    const assignmentMatch = pathname.match(/^\/quizlet\/assignments\/(\d+)$/);
    if (assignmentMatch !== null) {
        return { kind: "assignment", assignmentId: Number(assignmentMatch[1]) };
    }

    return { kind: "unknown" };
};

export const useStudentQuizletRoute = () => {
    const { pathname } = useLocation();
    return { pathname, route: parseStudentQuizletRoute(pathname) };
};
