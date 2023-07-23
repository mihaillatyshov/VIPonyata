export namespace LoadStatus {
    export const NONE = "NONE";
    export const LOADING = "LOADING";
    export const DONE = "DONE";
    export const ERROR = "ERROR";

    export type Type = typeof NONE | typeof LOADING | typeof DONE | typeof ERROR;
    export type TypeNotDone = typeof NONE | typeof LOADING | typeof ERROR;

    export type DataDoneOrNotDone<TData> = { loadStatus: TypeNotDone } | ({ loadStatus: typeof DONE } & TData);
}
