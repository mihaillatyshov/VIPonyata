import { useLocation } from "react-router-dom";

export const REVIEW_ROUTE_PATHS = {
    root: "/review",
    training: "/review/training",
    history: "/review/training/history",
    statuses: "/review/training/statuses",
    flashcards: "/review/flashcards",
    results: "/review/results",
    dictionary: (dictionaryId: number) => `/review/dictionaries/${dictionaryId}`,
    topic: (topicId: number) => `/review/topics/${topicId}`,
} as const;

export type ReviewRoute =
    | { kind: "root" }
    | { kind: "dictionary"; dictionaryId: number }
    | { kind: "topic"; topicId: number }
    | { kind: "training" }
    | { kind: "history" }
    | { kind: "statuses" }
    | { kind: "flashcards" }
    | { kind: "results" }
    | { kind: "unknown" };

const parseReviewRoute = (pathname: string): ReviewRoute => {
    switch (pathname) {
        case REVIEW_ROUTE_PATHS.root:
            return { kind: "root" };
        case REVIEW_ROUTE_PATHS.training:
            return { kind: "training" };
        case REVIEW_ROUTE_PATHS.history:
            return { kind: "history" };
        case REVIEW_ROUTE_PATHS.statuses:
            return { kind: "statuses" };
        case REVIEW_ROUTE_PATHS.flashcards:
            return { kind: "flashcards" };
        case REVIEW_ROUTE_PATHS.results:
            return { kind: "results" };
    }

    const dictionaryMatch = pathname.match(/^\/review\/dictionaries\/(\d+)$/);
    if (dictionaryMatch !== null) {
        return { kind: "dictionary", dictionaryId: Number(dictionaryMatch[1]) };
    }

    const topicMatch = pathname.match(/^\/review\/topics\/(\d+)$/);
    if (topicMatch !== null) {
        return { kind: "topic", topicId: Number(topicMatch[1]) };
    }

    return { kind: "unknown" };
};

export const useReviewRoute = () => {
    const { pathname } = useLocation();
    return { pathname, route: parseReviewRoute(pathname) };
};
