import { LoadStatus } from "libs/Status";
import { ImageState } from "models/Img";

export type ValidatorResult = string | undefined;

export type ValidatorFuncType<T, K> = (val: T, allFields: K) => ValidatorResult;

export const CombineValidators = <T, K>(...validators: ValidatorFuncType<T, K>[]): ValidatorFuncType<T, K> => {
    return (value: T, allFields: K) => {
        for (const validator of validators) {
            const res = validator(value, allFields);
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

export const ValidateImgError = (value: ImageState): ValidatorResult => {
    if (value.loadStatus === LoadStatus.ERROR) {
        return "Не удалось загрузить картинку";
    }
    return undefined;
};

export const ValidateImgLoading = (value: ImageState): ValidatorResult => {
    if (value.loadStatus === LoadStatus.LOADING) {
        return "Картинка еще не загрузилась";
    }
    return undefined;
};

export const ValidateImgNone = (value: ImageState): ValidatorResult => {
    if (value.loadStatus === LoadStatus.NONE) {
        return "Картинка не добавлена";
    }
    return undefined;
};
