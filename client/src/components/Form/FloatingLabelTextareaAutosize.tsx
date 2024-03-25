import React from "react";

import { TextareaAutosize } from "libs/TextareaAutosize";

import { InputBaseProps } from "./InputBase";
import InputError from "./InputError";

interface FloatingLabelTextareaAutosizeProps extends InputBaseProps {
    value: string;
    onChangeHandler: (value: string) => void;
    rows?: number;
}

export const FloatingLabelTextareaAutosize = ({
    value,
    errorMessage,
    noErrorField,
    onChangeHandler,
    placeholder,
    htmlId,
    className,
    rows,
    autoFocus,
}: FloatingLabelTextareaAutosizeProps) => {
    className = className ?? "";
    noErrorField = noErrorField ?? false;
    autoFocus = autoFocus ?? false;

    const hasError = errorMessage !== undefined && errorMessage !== "";

    return (
        <div className={`form-floating ${className}`}>
            <TextareaAutosize
                className={`form-control ${hasError ? "is-invalid" : ""}`}
                placeholder={placeholder}
                id={htmlId}
                value={value}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChangeHandler(e.target.value)}
                autoFocus={autoFocus}
                rows={rows}
            />
            <label htmlFor={htmlId}>{placeholder}</label>
            {!noErrorField && <InputError message={errorMessage} />}
        </div>
    );
};
