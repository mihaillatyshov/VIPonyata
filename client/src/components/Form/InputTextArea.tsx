import React from "react";
import { InputBaseProps } from "./InputBase";
import CSS from "csstype";
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
}: InputTextAreaProps) => {
    className = className ?? "";
    noErrorField = noErrorField === undefined ? false : noErrorField;

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
            />
            <label htmlFor={htmlId}>{placeholder}</label>
            {!noErrorField && <InputError message={errorMessage} />}
        </div>
    );
};

export default InputTextArea;
