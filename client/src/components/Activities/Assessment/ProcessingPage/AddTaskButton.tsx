interface AddTaskButtonProps {
    onClick: () => void;
}

const AddTaskButton = ({ onClick }: AddTaskButtonProps) => {
    return (
        <button type="button" className="btn btn-success mx-auto d-inline-flex" onClick={onClick}>
            Добавить задание
        </button>
    );
};

export default AddTaskButton;
