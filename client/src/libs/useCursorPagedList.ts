import { useCallback, useEffect, useRef, useState } from "react";

import { AjaxGet } from "libs/ServerAPI";
import { LoadStatus } from "libs/Status";

export type TCursorPageResponse<TKey extends string, TItem> = { [key in TKey]: TItem[] } & {
    next_cursor: string | null;
};

interface UseCursorPagedListParams<TKey extends string> {
    url: string;
    /** Поле ответа со списком элементов ("notifications", "history"…). */
    itemsKey: TKey;
    pageSize: number;
    urlParams?: Record<string, string | number>;
    /** false — список сброшен и не загружается (например, закрытое модальное окно). */
    enabled?: boolean;
}

/**
 * Список с кнопкой «Показать ещё»: первая страница грузится сразу, следующие — по `loadMore()`.
 * Сервер отдаёт `next_cursor`, по которому запрашивается продолжение; `null` — больше данных нет.
 * Ответы устаревших запросов (сменились параметры, список сброшен) игнорируются.
 */
export const useCursorPagedList = <TItem, TKey extends string>({
    url,
    itemsKey,
    pageSize,
    urlParams,
    enabled = true,
}: UseCursorPagedListParams<TKey>) => {
    const [items, setItems] = useState<TItem[]>([]);
    const [loadStatus, setLoadStatus] = useState<LoadStatus.Type>(LoadStatus.NONE);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
    const [isLoadMoreError, setIsLoadMoreError] = useState<boolean>(false);
    const requestIdRef = useRef<number>(0);

    const paramsKey = JSON.stringify(urlParams ?? {});

    const fetchPage = useCallback(
        (cursor: string | null) => {
            const params: Record<string, string | number> = { ...JSON.parse(paramsKey), limit: pageSize };
            if (cursor !== null) {
                params.cursor = cursor;
            }

            return AjaxGet<TCursorPageResponse<TKey, TItem>>({ url, urlParams: params });
        },
        [paramsKey, pageSize, url],
    );

    useEffect(() => {
        const requestId = ++requestIdRef.current;
        setItems([]);
        setNextCursor(null);
        setIsLoadingMore(false);
        setIsLoadMoreError(false);

        if (!enabled) {
            setLoadStatus(LoadStatus.NONE);
            return;
        }

        setLoadStatus(LoadStatus.LOADING);
        fetchPage(null)
            .then((json) => {
                if (requestId !== requestIdRef.current) {
                    return;
                }
                setItems(json[itemsKey]);
                setNextCursor(json.next_cursor);
                setLoadStatus(LoadStatus.DONE);
            })
            .catch(() => {
                if (requestId === requestIdRef.current) {
                    setLoadStatus(LoadStatus.ERROR);
                }
            });
    }, [enabled, fetchPage, itemsKey]);

    const loadMore = useCallback(() => {
        if (nextCursor === null || isLoadingMore) {
            return;
        }

        const requestId = requestIdRef.current;
        setIsLoadingMore(true);
        setIsLoadMoreError(false);
        fetchPage(nextCursor)
            .then((json) => {
                if (requestId !== requestIdRef.current) {
                    return;
                }
                setItems((prevItems) => [...prevItems, ...json[itemsKey]]);
                setNextCursor(json.next_cursor);
            })
            .catch(() => {
                if (requestId === requestIdRef.current) {
                    setIsLoadMoreError(true);
                }
            })
            .finally(() => {
                if (requestId === requestIdRef.current) {
                    setIsLoadingMore(false);
                }
            });
    }, [fetchPage, isLoadingMore, itemsKey, nextCursor]);

    return {
        items,
        loadStatus,
        hasMore: nextCursor !== null,
        isLoadingMore,
        isLoadMoreError,
        loadMore,
    };
};
