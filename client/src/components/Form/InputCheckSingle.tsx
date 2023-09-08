import React from "react";
import { InputBaseProps } from "./InputBase";

interface InputCheckSingleProps extends InputBaseProps {
    id: number;
    selectedIds: number[];
    blockName: string;
    htmlId: string;
    placeholder: string;
    className?: string;
    onChange: (id: number) => void;
}

const InputCheckSingle = ({ id, selectedIds, htmlId, placeholder, className, onChange }: InputCheckSingleProps) => {
    className = className ?? "";

    return (
        <div className={`d-flex justify-content-center align-items-center form-check ${className}`}>
            <input
                type="checkbox"
                value={id}
                className={"form-check-input"}
                id={htmlId}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(id)}
                checked={selectedIds.includes(id)}
            />
            <label className="form-check-label" htmlFor={htmlId}>
                {placeholder}
            </label>
        </div>
    );
};

export default InputCheckSingle;
