import React from "react";
import { InputBaseProps } from "./InputBase";

const InputText = ({ htmlId, placeholder, value, className, onChangeHandler }: InputBaseProps) => {
    className = className ?? "";
    return (
        <div className={`form-floating ${className}`}>
            <input
                type="text"
                className="form-control"
                value={value}
                id={htmlId}
                placeholder={placeholder}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChangeHandler(e.target.value)}
            />
            <label htmlFor={htmlId}>{placeholder}</label>
        </div>
    );
};

export default InputText;
