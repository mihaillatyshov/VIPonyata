import React from "react";
import { InputBaseProps } from "./InputBase";

export type TOption = { value: string; title: string };

interface InputSelectProps extends InputBaseProps {
    value: string;
    onChangeHandler: (value: string) => void;
    options: TOption[];
}

const InputSelect = ({ htmlId, placeholder, value, className, onChangeHandler, options }: InputSelectProps) => {
    className = className ?? "";
    return (
        <div className={`form-floating ${className}`}>
            <select
                className="form-select"
                value={value}
                id={htmlId}
                placeholder={placeholder}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChangeHandler(e.target.value)}
            >
                {options.map(({ value, title }) => (
                    <option key={value} value={value}>
                        {title}
                    </option>
                ))}
            </select>
            <label htmlFor={htmlId}>{placeholder}</label>
        </div>
    );
};

export default InputSelect;
