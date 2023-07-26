import React from "react";

interface InputErrorProps {
    message?: string;
    className?: string;
    isWarning?: boolean;
}

const InputError = ({ message, className, isWarning }: InputErrorProps) => {
    isWarning = isWarning ?? false;
    className = className ?? "";
    return (
        <div className={`d-flex ${className}`}>
            <small className={isWarning ? "text-warning" : "text-danger"}> &nbsp; {message}</small>
        </div>
    );
};

export default InputError;
