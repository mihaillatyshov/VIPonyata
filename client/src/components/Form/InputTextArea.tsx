import React from "react";

import CSS from "csstype";

import { InputBaseProps } from "./InputBase";
import InputError from "./InputError";

interface InputTextAreaProps extends InputBaseProps {
    value: string;
    onChangeHandler: (value: string) => void;
    rows?: number;
}

const InputTextArea = ({
    value,
    errorMessage,
    noErrorField,
    onChangeHandler,
    placeholder,
    htmlId,
    className,
    rows,
    autoFocus,
}: InputTextAreaProps) => {
    className = className ?? "";
    noErrorField = noErrorField ?? false;
    autoFocus = autoFocus ?? false;

    const hasError = errorMessage !== undefined && errorMessage !== "";

    const style: CSS.Properties = {
        height: `${rows}em`,
        resize: "none",
    };

    return (
        <div className={`form-floating ${className}`}>
            <textarea
                className={`form-control ${hasError ? "is-invalid" : ""}`}
                placeholder={placeholder}
                id={htmlId}
                value={value}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChangeHandler(e.target.value)}
                style={rows ? style : {}}
                autoFocus={autoFocus}
            />
            <label htmlFor={htmlId}>{placeholder}</label>
            {!noErrorField && <InputError message={errorMessage} />}
        </div>
    );
};

export default InputTextArea;
