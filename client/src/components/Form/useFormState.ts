import { useState } from "react";

import { ValidatorFuncType } from "validators/FormValidators";

type TAvail = { [key: string]: any };

type ChangeHandlersInput<T> = {
    [K in keyof T]?: (val: any) => T[K];
};

type ChangeHandlersResult<T> = {
    [K in keyof T]: (val: any) => void;
};

type ErrorType<T> = {
    [K in keyof T]?: string;
};

type ValidatorsInput<T> = {
    [K in keyof T]?: ValidatorFuncType<T[K], T>;
};

type ValidatorsResult<T> = {
    [K in keyof T]?: () => boolean;
};

type InputPropsType<T> = {
    [K in keyof T]: {
        value: T[K];
        onChangeHandler: ChangeHandlersResult<T>[K];
        errorMessage: ErrorType<T>[K];
        customValidation: ValidatorsResult<T>[K];
    };
};

export interface FormState<T extends TAvail> {
    inputs: T;
    handlers: ChangeHandlersResult<T>;
    validators: ValidatorsResult<T>;
    validateForm: () => boolean;
    errors: ErrorType<T>;
    inputProps: InputPropsType<T>;
}
export const useFormState = <T extends TAvail>(
    defaults: T,
    inHandlers: ChangeHandlersInput<T> = {},
    inValidators: ValidatorsInput<T> = {}
): FormState<T> => {
    const [inputs, setInputs] = useState<T>(defaults);
    const [clientErrors, setClientErrors] = useState<ErrorType<T>>({});
    const [serverErrors, setServerErrors] = useState<ErrorType<T>>({});

    const handlers: ChangeHandlersResult<T> = Object.fromEntries(
        Object.keys(defaults).map((key) => {
            return [
                key,
                (val: any) => {
                    setInputs((prev: T) => {
                        const handler = inHandlers[key];
                        prev[key as keyof T] = handler !== undefined ? handler(val) : val;
                        return { ...prev };
                    });
                },
            ];
        })
    ) as ChangeHandlersResult<T>;

    const validators: ValidatorsResult<T> = Object.fromEntries(
        Object.entries(inValidators).map(([key, validate]) => {
            return [
                key,
                () => {
                    const res = validate(inputs[key], inputs);
                    setClientErrors((prev: ErrorType<T>) => {
                        prev[key as keyof T] = res;
                        return { ...prev };
                    });
                    return res === undefined;
                },
            ];
        })
    ) as ValidatorsResult<T>;

    const inputProps: InputPropsType<T> = Object.fromEntries(
        Object.keys(defaults).map((key) => {
            return [
                key,
                {
                    value: inputs[key],
                    onChangeHandler: handlers[key],
                    errorMessage: clientErrors[key] || serverErrors[key],
                    customValidation: validators[key],
                },
            ];
        })
    ) as InputPropsType<T>;

    const validateForm = () => {
        let res = true;
        Object.values(validators).forEach((validate) => {
            const validRes = validate ? validate() : true;
            res = res && validRes;
        });
        return res;
    };

    return {
        inputs,
        handlers,
        validators: validators,
        validateForm,
        errors: { ...clientErrors, ...serverErrors },
        inputProps: inputProps,
    };
};
