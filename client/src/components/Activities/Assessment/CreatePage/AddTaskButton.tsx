import React from "react";

interface AddTaskButtonProps {
    insertId: number;
    handleClick: (insertId: number) => void;
}

const AddTaskButton = ({ insertId, handleClick }: AddTaskButtonProps) => {
    return (
        <input
            type="button"
            className="btn btn-primary mx-auto d-flex"
            onClick={() => handleClick(insertId)}
            value={"Добавить задание"}
        />
    );
};

export default AddTaskButton;
