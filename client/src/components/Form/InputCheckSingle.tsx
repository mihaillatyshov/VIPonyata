import React from "react";

import { InputBaseProps } from "./InputBase";

interface InputCheckSingleProps extends InputBaseProps {
    id: number;
    selectedIds: number[];
    htmlId: string;
    placeholder: string;
    className?: string;
    isDisabled?: boolean;
    onChange: (id: number) => void;
}

const InputCheckSingle = ({
    id,
    selectedIds,
    htmlId,
    placeholder,
    className,
    isDisabled,
    onChange,
}: InputCheckSingleProps) => {
    className = className ?? "";

    return (
        <div className={`${className} cursor-pointer`}>
            <input
                type="checkbox"
                value={id}
                className={"form-check-input mt-0 cursor-pointer"}
                id={htmlId}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(id)}
                checked={selectedIds.includes(id)}
                disabled={isDisabled}
            />
            <label className="form-check-label" htmlFor={htmlId}>
                {placeholder}
            </label>
        </div>
    );
};

export default InputCheckSingle;
