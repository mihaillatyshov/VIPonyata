import Modal from "react-bootstrap/Modal";

import { assessmentTaskRusNameAliases, TAssessmentTaskName } from "models/Activity/Items/TAssessmentItems";

type TAddTasks = (name: TAssessmentTaskName) => void;

const leftTaskNames: TAssessmentTaskName[] = [
    TAssessmentTaskName.TEST_SINGLE,
    TAssessmentTaskName.TEST_MULTI,
    TAssessmentTaskName.FIND_PAIR,
    TAssessmentTaskName.CLASSIFICATION,
    TAssessmentTaskName.FILL_SPACES_EXISTS,
    TAssessmentTaskName.CREATE_SENTENCE,
];

const rightTaskNames: TAssessmentTaskName[] = [
    TAssessmentTaskName.TEXT,
    TAssessmentTaskName.IMG,
    TAssessmentTaskName.AUDIO,
    TAssessmentTaskName.OPEN_QUESTION,
    TAssessmentTaskName.SENTENCE_ORDER,
    TAssessmentTaskName.FILL_SPACES_BY_HAND,
];

const assessmentTaskIconAliases: Record<TAssessmentTaskName, string> = {
    [TAssessmentTaskName.TEXT]: "bi-card-text",
    [TAssessmentTaskName.TEST_SINGLE]: "bi-ui-radios",
    [TAssessmentTaskName.TEST_MULTI]: "bi-ui-checks-grid",
    [TAssessmentTaskName.FIND_PAIR]: "bi-diagram-3",
    [TAssessmentTaskName.CREATE_SENTENCE]: "bi-blockquote-left",
    [TAssessmentTaskName.FILL_SPACES_EXISTS]: "bi-input-cursor-text",
    [TAssessmentTaskName.FILL_SPACES_BY_HAND]: "bi-pencil-square",
    [TAssessmentTaskName.CLASSIFICATION]: "bi-collection",
    [TAssessmentTaskName.SENTENCE_ORDER]: "bi-sort-down",
    [TAssessmentTaskName.OPEN_QUESTION]: "bi-chat-left-dots",
    [TAssessmentTaskName.IMG]: "bi-image",
    [TAssessmentTaskName.AUDIO]: "bi-mic",
    [TAssessmentTaskName.BLOCK_BEGIN]: "bi-brackets",
    [TAssessmentTaskName.BLOCK_END]: "bi-brackets",
};

const assessmentSelectTaskLabelAliases: Partial<Record<TAssessmentTaskName, string>> = {
    [TAssessmentTaskName.FILL_SPACES_EXISTS]: "Пропуски с известными словами",
    [TAssessmentTaskName.FILL_SPACES_BY_HAND]: "Пропуски со своими словами",
};

interface SelectTypeModalItemProps {
    name: TAssessmentTaskName;
    close: () => void;
    addTasks: TAddTasks;
}

const SelectTypeModalItem = ({ name, close, addTasks }: SelectTypeModalItemProps) => {
    if (name === TAssessmentTaskName.BLOCK_BEGIN || name === TAssessmentTaskName.BLOCK_END) {
        return null;
    }

    return (
        <button
            type="button"
            className="notification__item clickable assessment-select-type-modal__button"
            onClick={() => {
                addTasks(name);
                close();
            }}
        >
            <span className="notification__item-chip">
                <i className={`bi ${assessmentTaskIconAliases[name]}`} aria-hidden="true"></i>
            </span>
            <span className="notification__item-inline-content">
                {assessmentSelectTaskLabelAliases[name] ?? assessmentTaskRusNameAliases[name]}
            </span>
        </button>
    );
};

interface SelectTypeModalProps {
    isShow: boolean;
    close: () => void;
    addTasks: TAddTasks;
}

const SelectTypeModal = ({ isShow, close, addTasks }: SelectTypeModalProps) => {
    return (
        <Modal size="xl" show={isShow} onHide={close} className="notifications-modal assessment-select-type-modal">
            <Modal.Header closeButton className="modal-bg">
                <Modal.Title>Выбор задания</Modal.Title>
            </Modal.Header>
            <Modal.Body className="modal-bg">
                <div className="assessment-select-type-modal__list">
                    <div className="assessment-select-type-modal__column">
                        {leftTaskNames.map((name) => (
                            <SelectTypeModalItem key={name} name={name} addTasks={addTasks} close={close} />
                        ))}
                    </div>
                    <div className="assessment-select-type-modal__column">
                        {rightTaskNames.map((name) => (
                            <SelectTypeModalItem key={name} name={name} addTasks={addTasks} close={close} />
                        ))}
                    </div>
                </div>
            </Modal.Body>
        </Modal>
    );
};

export default SelectTypeModal;
