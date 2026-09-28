export type UrlParamValue = string | number | boolean | null | undefined;
export type UrlParams = Record<string, UrlParamValue>;

interface ServerAPIParams {
    url: string;
    /** Query-параметры; `null`/`undefined` пропускаются, значения кодируются. */
    urlParams?: UrlParams;
    body?: unknown;
    headers?: HeadersInit;
    /** Сигнал отмены (TanStack Query передаёт его в `queryFn`). */
    signal?: AbortSignal;
}

/**
 * - `http` — сервер ответил ошибкой (4xx/5xx); `json` есть, если тело ответа — JSON;
 * - `network` — ответа нет (нет сети, сервер недоступен);
 * - `parse` — успешный ответ, но тело не JSON;
 * - `abort` — запрос отменён (`signal`).
 */
export type ApiErrorKind = "http" | "network" | "parse" | "abort";

export class ApiError<TJson = any> extends Error {
    readonly kind: ApiErrorKind;
    /** HTTP-статус; 0 — ответа не было. */
    readonly status: number;
    readonly json: TJson | undefined;
    readonly response: Response | undefined;
    /** Совместимость со старым кодом: `false` — ответ сервера с JSON, который можно показать пользователю. */
    readonly isServerError: boolean;

    constructor(kind: ApiErrorKind, message: string, response?: Response, json?: TJson) {
        super(message);
        this.name = "ApiError";
        this.kind = kind;
        this.status = response?.status ?? 0;
        this.response = response;
        this.json = json;
        this.isServerError = !(kind === "http" && json !== undefined);
    }
}

export interface ProcessableServerError<T> extends ApiError<T> {
    isServerError: false;
    json: T;
    response: Response;
}

export const isApiError = (e: unknown): e is ApiError => e instanceof ApiError;

export const isProcessableError = <T>(e: unknown): e is ProcessableServerError<T> => {
    return isApiError(e) && !e.isServerError;
};

export const isAbortError = (e: unknown): boolean => isApiError(e) && e.kind === "abort";

/** Текст ошибки для пользователя: `message` из ответа сервера или `fallback`. */
export const getApiErrorMessage = (e: unknown, fallback: string): string => {
    if (isProcessableError<{ message?: unknown }>(e) && typeof e.json?.message === "string" && e.json.message) {
        return e.json.message;
    }

    return fallback;
};

let unauthorizedHandler: (() => void) | null = null;

/** Вызывается при ответе 401 (сессия истекла) — App сбрасывает пользователя и показывает логин. */
export const setUnauthorizedHandler = (handler: (() => void) | null) => {
    unauthorizedHandler = handler;
};

const buildQueryString = (params: UrlParams | undefined) => {
    if (params === undefined) {
        return "";
    }

    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
            searchParams.append(key, String(value));
        }
    });

    const query = searchParams.toString();
    return query ? `?${query}` : "";
};

const readJson = async (response: Response): Promise<unknown> => {
    const text = await response.text();
    return text === "" ? undefined : JSON.parse(text);
};

const Ajax = async <T>(method: string, { url, urlParams, body, headers, signal }: ServerAPIParams): Promise<T> => {
    let response: Response;
    try {
        response = await fetch(url + buildQueryString(urlParams), {
            method,
            body: body === undefined ? undefined : JSON.stringify(body),
            headers: body === undefined ? headers : { "Content-Type": "application/json; charset=UTF-8", ...headers },
            signal,
        });
    } catch {
        if (signal?.aborted) {
            throw new ApiError("abort", "Request aborted");
        }
        throw new ApiError("network", "Network error");
    }

    if (response.status === 401) {
        unauthorizedHandler?.();
    }

    let json: unknown;
    try {
        json = await readJson(response);
    } catch {
        if (signal?.aborted) {
            throw new ApiError("abort", "Request aborted", response);
        }
        if (response.ok) {
            throw new ApiError("parse", "Invalid JSON in response", response);
        }
        throw new ApiError("http", `HTTP ${response.status}`, response);
    }

    if (!response.ok) {
        throw new ApiError("http", `HTTP ${response.status}`, response, json);
    }

    // Пустой ответ (204) возвращается как undefined.
    return json as T;
};

export const AjaxGet = <T>(params: ServerAPIParams) => Ajax<T>("GET", params);

export const AjaxPost = <T>(params: ServerAPIParams) => Ajax<T>("POST", params);

export const AjaxPatch = <T>(params: ServerAPIParams) => Ajax<T>("PATCH", params);

export const AjaxDelete = <T>(params: ServerAPIParams) => Ajax<T>("DELETE", params);
