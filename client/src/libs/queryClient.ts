import { QueryClient } from "@tanstack/react-query";

import { isApiError } from "./ServerAPI";

const MAX_RETRIES = 1;

/** Повторяем только сбои сети и 5xx: 4xx (нет доступа, не найдено, ошибка валидации) повтор не исправит. */
const shouldRetry = (failureCount: number, error: unknown) => {
    if (failureCount >= MAX_RETRIES) {
        return false;
    }

    if (!isApiError(error)) {
        return false;
    }

    return error.kind === "network" || (error.kind === "http" && error.status >= 500);
};

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: shouldRetry,
            // Многие страницы — редакторы с локальными черновиками: не перезапрашиваем данные при фокусе окна.
            refetchOnWindowFocus: false,
        },
        mutations: {
            retry: false,
        },
    },
});
