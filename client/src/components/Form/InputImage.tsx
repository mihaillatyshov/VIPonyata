import React from "react";

export interface InputImageProps {
    htmlId: string;
    placeholder: string;
    value?: string;
    className?: string;
    onChangeHandler: (value: string) => void;
}

const InputImage = ({ htmlId, placeholder, value, className, onChangeHandler }: InputImageProps) => {
    const testHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
        console.log(e.currentTarget.value, e.currentTarget.files);
    };

    const hasValue = value !== undefined;

    return (
        <div>
            <label htmlFor={htmlId} className="form-label">
                {hasValue ? <img src={value} alt={placeholder}></img> : "Default file input example"}
            </label>
            <input
                className={hasValue ? "d-none" : "form-control"}
                type="file"
                id={htmlId}
                accept="image/*"
                onChange={testHandler}
            />
        </div>
    );
};

export default InputImage;
