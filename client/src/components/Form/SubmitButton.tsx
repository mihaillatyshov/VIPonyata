import React from "react";

interface SubmitButtonProps {
    value: string;
    className?: string;
}

const SubmitButton = ({ value, className }: SubmitButtonProps) => {
    className = className ?? "";
    return <input className={`btn ${className}`} type="submit" value={value} />;
};

export default SubmitButton;
