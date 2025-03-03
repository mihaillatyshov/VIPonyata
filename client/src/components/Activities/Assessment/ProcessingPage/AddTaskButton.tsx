import React from "react";

interface AddTaskButtonProps {
    onClick: () => void;
}

const AddTaskButton = ({ onClick }: AddTaskButtonProps) => {
    return (
        <button className="btn btn-primary mx-auto d-inline-flex" onClick={onClick}>
            Добавить задание
        </button>
    );
};

export default AddTaskButton;
