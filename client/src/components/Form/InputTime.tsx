import React from "react";

import { InputBaseProps } from "./InputBase";
import InputError from "./InputError";

interface InputTimeProps extends InputBaseProps {
    value: string;
    onChangeHandler: (value: string) => void;
    customValidation?: () => void;
}

const InputTime = ({
    htmlId,
    placeholder,
    value,
    errorMessage,
    className,
    onChangeHandler,
    customValidation,
}: InputTimeProps) => {
    className = className ?? "";

    const hasError = errorMessage !== undefined && errorMessage !== "";

    const clearHandler = () => {
        onChangeHandler("00:00:00");
    };

    return (
        <>
            <div className="input-group">
                <input type="button" className="btn btn-secondary " value="Сброс" onClick={clearHandler} />
                <div className={`form-floating ${className}`}>
                    <input
                        type="time"
                        className={`form-control ${hasError ? "is-invalid" : ""}`}
                        value={value}
                        id={htmlId}
                        placeholder={placeholder}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChangeHandler(e.target.value)}
                        onBlur={customValidation}
                        step="2"
                    />
                    <label htmlFor={htmlId}>{placeholder}</label>
                </div>
            </div>
            <InputError message={errorMessage} />
        </>
    );
};

export default InputTime;
