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
    if (value === "") {
        return "Поле не должно быть пустым";
    }
    return undefined;
};
