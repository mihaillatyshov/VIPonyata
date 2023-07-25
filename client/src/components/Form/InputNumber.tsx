import React from "react";
import { InputBaseProps } from "./InputBase";
import InputError from "./InputError";

interface InputNumberProps extends InputBaseProps {
    value: number;
    onChangeHandler: (value: number) => void;
}

const InputNumber = ({ htmlId, placeholder, value, errorMessage, className, onChangeHandler }: InputNumberProps) => {
    className = className ?? "";
    const hasError = errorMessage !== undefined && errorMessage !== "";

    const handler = (e: React.ChangeEvent<HTMLInputElement>) => {
        const res = parseInt(e.target.value);
        isNaN(res) || onChangeHandler(res);
    };

    return (
        <div className={`form-floating ${className}`}>
            <input
                type="number"
                className={`form-control ${hasError ? "is-invalid" : ""}`}
                value={value}
                id={htmlId}
                placeholder={placeholder}
                onChange={handler}
            />
            <label htmlFor={htmlId}>{placeholder}</label>
            <InputError message={errorMessage} />
        </div>
    );
};

export default InputNumber;
