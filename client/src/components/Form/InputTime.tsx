import React from "react";

import { InputBaseProps } from "./InputBase";
import InputError from "./InputError";
import styles from "./Styles.module.css";

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
            <div className={`input-group ${styles.inputTimeGroup}`}>
                <button
                    type="button"
                    className={`btn btn-secondary student-assessment-back-btn ${styles.inputTimeResetButton}`}
                    onClick={clearHandler}
                    title="Сбросить время"
                    aria-label="Сбросить время"
                >
                    <i className="bi bi-clock-history" aria-hidden="true" />
                </button>
                <div className={`form-floating ${styles.inputTimeFieldWrapper} ${className}`}>
                    <input
                        type="time"
                        className={`form-control ${styles.inputTimeField} ${hasError ? "is-invalid" : ""}`}
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
