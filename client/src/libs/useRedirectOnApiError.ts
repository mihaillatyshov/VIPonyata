import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { isProcessableError } from "./ServerAPI";

/**
 * Уводит со страницы, если запрос завершился ошибкой с ответом сервера (403/404 и т.п.).
 * `getPath` по статусу и JSON ответа возвращает адрес перехода или `null`, чтобы остаться на странице.
 */
export const useRedirectOnApiError = <T = any>(error: unknown, getPath: (status: number, json: T) => string | null) => {
    const navigate = useNavigate();
    const path = isProcessableError<T>(error) ? getPath(error.status, error.json) : null;

    useEffect(() => {
        if (path !== null) {
            navigate(path, { replace: true });
        }
    }, [navigate, path]);
};
