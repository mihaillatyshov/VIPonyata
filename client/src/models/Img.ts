import { LoadStatus } from "libs/Status";

export interface ImageStateDone {
    loadStatus: typeof LoadStatus.DONE;
    url: string;
}

export interface ImageStateLoading {
    loadStatus: typeof LoadStatus.LOADING;
    url?: string;
}

export interface ImageStateError {
    loadStatus: typeof LoadStatus.ERROR;
    message?: string;
    url?: string;
}

export type ImageState = ImageStateDone | ImageStateError | ImageStateLoading | { loadStatus: typeof LoadStatus.NONE };
