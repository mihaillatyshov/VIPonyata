import { LoadStatus } from "libs/Status";

export interface AudioStateDone {
    loadStatus: typeof LoadStatus.DONE;
    url: string;
}

export interface AudioStateLoading {
    loadStatus: typeof LoadStatus.LOADING;
    url?: string;
}

export interface AudioStateError {
    loadStatus: typeof LoadStatus.ERROR;
    message?: string;
    url?: string;
}

export type AudioState = AudioStateDone | AudioStateError | AudioStateLoading | { loadStatus: typeof LoadStatus.NONE };
