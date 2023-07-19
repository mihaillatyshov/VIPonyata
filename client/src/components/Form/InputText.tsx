import React from "react";

interface InputTextProps {
    htmlId: string;
    placeholder: string;
    onChangeHandler: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const InputText = ({ htmlId, placeholder, onChangeHandler }: InputTextProps) => {
    return (
        <div className="form-floating">
            <input
                type="text"
                className="form-control"
                id={htmlId}
                placeholder={placeholder}
                onChange={onChangeHandler}
            />
            <label htmlFor={htmlId}>{placeholder}</label>
        </div>
    );
};

export default InputText;
