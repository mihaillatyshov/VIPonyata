import { LoadStatus } from "libs/Status";

export interface ImageStateDone {
    loadStatus: typeof LoadStatus.DONE;
    url: string;
}

export interface ImageStateError {
    loadStatus: typeof LoadStatus.ERROR;
    code: number;
    message?: string;
    url?: string;
}

export type ImageState =
    | ImageStateDone
    | ImageStateError
    | { loadsStatus: typeof LoadStatus.NONE | typeof LoadStatus.LOADING };
