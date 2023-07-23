import React from "react";
import { InputBaseProps } from "./InputBase";

interface InputNumberProps extends InputBaseProps {
    value: number;
    onChangeHandler: (value: number) => void;
}

const InputText = ({ htmlId, placeholder, value, className, onChangeHandler }: InputNumberProps) => {
    className = className ?? "";
    return (
        <div className={`form-floating ${className}`}>
            <input
                type="number"
                className="form-control is-invalid"
                value={value}
                id={htmlId}
                placeholder={placeholder}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChangeHandler(parseInt(e.target.value))}
            />
            <label htmlFor={htmlId}>{placeholder}</label>
        </div>
    );
};

export default InputText;
