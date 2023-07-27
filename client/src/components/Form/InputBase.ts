import { LoadStatus } from "libs/Status";
import { ImageState } from "models/Img";

export interface InputBaseProps {
    htmlId: string;
    placeholder: string;
    className?: string;
    errorMessage?: string;
}

export const GetStringOrNull = (value: string): string | null => (value.trim() === "" ? null : value.trim());

export const GetImg = (value: ImageState): string | null => {
    if (value.loadStatus === LoadStatus.DONE) {
        return value.url;
    }
    if (value.loadStatus === LoadStatus.ERROR || value.loadStatus === LoadStatus.LOADING) {
        return value.url ?? null;
    }
    return null;
};
