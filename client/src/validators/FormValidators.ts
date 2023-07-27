import { LoadStatus } from "libs/Status";
import { ImageState } from "models/Img";

export type ValidatorResult = string | undefined;

export type ValidatorFuncType<T> = (val: T) => ValidatorResult;

export const CombineValidators = <T>(value: T, ...validators: ValidatorFuncType<T>[]): ValidatorFuncType<T> => {
    return () => {
        for (const validator of validators) {
            const res = validator(value);
            if (res !== undefined) {
                return res;
            }
        }
        return undefined;
    };
};

export const ValidateEmpty = (value: string): ValidatorResult => {
    if (value.trim() === "") {
        return "Поле не должно быть пустым";
    }
    return undefined;
};

export const ValidateImgError = (value: ImageState) => {
    if (value.loadStatus === LoadStatus.ERROR) {
        return "Не удалось загрузить картинку";
    }
    return undefined;
};

export const ValidateImgLoading = (value: ImageState) => {
    if (value.loadStatus === LoadStatus.LOADING) {
        return "Картинка еще не загрузилась";
    }
    return undefined;
};

export const ValidateImgNone = (value: ImageState) => {
    if (value.loadStatus === LoadStatus.NONE) {
        return "Картинка не добавлена";
    }
    return undefined;
};
