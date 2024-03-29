import React from "react";

import { InputBaseProps } from "./InputBase";
import InputError from "./InputError";

interface InputTextProps extends InputBaseProps {
    value: string;
    type?: "text" | "password";
    onChangeHandler: (value: string) => void;
    customValidation?: () => void;
}

const InputText = ({
    htmlId,
    placeholder,
    value,
    type = "text",
    errorMessage,
    noErrorField,
    className,
    onChangeHandler,
    customValidation,
}: InputTextProps) => {
    className = className ?? "";
    noErrorField = noErrorField === undefined ? false : noErrorField;

    const hasError = errorMessage !== undefined && errorMessage !== "";

    return (
        <div className={`form-floating ${className}`}>
            <input
                type={type}
                className={`form-control ${hasError ? "is-invalid" : ""}`}
                value={value}
                id={htmlId}
                placeholder={placeholder}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChangeHandler(e.target.value)}
                onBlur={customValidation}
            />
            <label htmlFor={htmlId}>{placeholder}</label>
            {!noErrorField && <InputError message={errorMessage} />}
        </div>
    );
};

export default InputText;
