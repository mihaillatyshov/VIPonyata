import React from "react";
import { InputBaseProps } from "./InputBase";

interface InputRadioSingleProps extends InputBaseProps {
    id: number;
    selectedId: number;
    blockName: string;
    htmlId: string;
    placeholder: string;
    className?: string;
    onChange: (id: number) => void;
}

const InputRadioSingle = ({ id, selectedId, htmlId, placeholder, className, onChange }: InputRadioSingleProps) => {
    className = className ?? "";

    return (
        <div className={className}>
            <input
                type="radio"
                value={id}
                className="form-check-input mt-0"
                id={htmlId}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(id)}
                checked={selectedId === id}
            />
            <label className="form-check-label" htmlFor={htmlId}>
                {placeholder}
            </label>
        </div>
    );
};

export default InputRadioSingle;
