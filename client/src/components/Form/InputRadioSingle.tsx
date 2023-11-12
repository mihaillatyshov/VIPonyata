import React from "react";

import { InputBaseProps } from "./InputBase";

interface InputRadioSingleProps extends InputBaseProps {
    id: number;
    selectedId: number;
    htmlId: string;
    placeholder: string;
    className?: string;
    isDisabled?: boolean;

    onChange: (id: number) => void;
}

const InputRadioSingle = ({
    id,
    selectedId,
    htmlId,
    placeholder,
    className,
    isDisabled,
    onChange,
}: InputRadioSingleProps) => {
    className = className ?? "";

    return (
        <div className={`${className} cursor-pointer`}>
            <input
                type="radio"
                value={id}
                className="form-check-input mt-0 cursor-pointer"
                id={htmlId}
                onChange={() => onChange(id)}
                checked={selectedId === id}
                disabled={isDisabled}
            />
            <label className="form-check-label" htmlFor={htmlId}>
                {placeholder}
            </label>
        </div>
    );
};

export default InputRadioSingle;
