import React from "react";

interface InputErrorProps {
    message?: string;
    className?: string;
}

const InputError = ({ message, className }: InputErrorProps) => {
    className = className ?? "";
    return (
        <div className={`d-flex ${className}`}>
            <small className="text-danger"> &nbsp; {message}</small>
        </div>
    );
};

export default InputError;
