import React from "react";

interface AddBlockButtonProps {
    onClick: () => void;
}

export const AddBlockButton = ({ onClick }: AddBlockButtonProps) => {
    return (
        <button className="btn btn-primary mx-auto d-inline-flex ms-4" onClick={onClick}>
            Создать блок
        </button>
    );
};
