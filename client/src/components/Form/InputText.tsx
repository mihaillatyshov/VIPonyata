import React from "react";
import { InputBaseProps } from "./InputBase";
import InputError from "./InputError";

interface InputTextProps extends InputBaseProps {
    value: string;
    onChangeHandler: (value: string) => void;
    customValidation?: () => void;
}

const InputText = ({
    htmlId,
    placeholder,
    value,
    errorMessage,
    className,
    onChangeHandler,
    customValidation,
}: InputTextProps) => {
    className = className ?? "";

    const hasError = errorMessage !== undefined && errorMessage !== "";

    return (
        <div className={`form-floating ${className}`}>
            <input
                type="text"
                className={`form-control ${hasError ? "is-invalid" : ""}`}
                value={value}
                id={htmlId}
                placeholder={placeholder}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChangeHandler(e.target.value)}
                onBlur={customValidation}
            />
            <label htmlFor={htmlId}>{placeholder}</label>
            <InputError message={errorMessage} />
        </div>
    );
};

export default InputText;