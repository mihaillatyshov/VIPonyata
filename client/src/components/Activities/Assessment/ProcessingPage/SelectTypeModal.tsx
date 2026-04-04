import { useState } from "react";
import Modal from "react-bootstrap/Modal";

import {
    assessmentTaskRusNameAliases,
    TAssessmentTaskName,
    TTeacherAssessmentAnyItem,
} from "models/Activity/Items/TAssessmentItems";

import { ImportTestsModalModal } from "./ImportTestsModal";

type TAddTasks = (name: TAssessmentTaskName, taskData?: TTeacherAssessmentAnyItem[]) => void;

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

interface SelectTypeModalItemProps {
    name: TAssessmentTaskName;
    setIsImportTestsModalShow: (val: boolean) => void;
    setImportTestsModalTaskName: (val: TAssessmentTaskName.TEST_SINGLE | TAssessmentTaskName.TEST_MULTI) => void;
    close: () => void;
    addTasks: TAddTasks;
}

const SelectTypeModalItem = ({
    name,
    setIsImportTestsModalShow,
    setImportTestsModalTaskName,
    close,
    addTasks,
}: SelectTypeModalItemProps) => {
    if (name === TAssessmentTaskName.BLOCK_BEGIN || name === TAssessmentTaskName.BLOCK_END) {
        return null;
    }

    if (name === TAssessmentTaskName.TEST_SINGLE || name === TAssessmentTaskName.TEST_MULTI) {
        return (
            <div className="assessment-select-type-modal__row">
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
                    <span className="notification__item-inline-content">{assessmentTaskRusNameAliases[name]}</span>
                </button>
                <button
                    type="button"
                    className="notification__item clickable assessment-select-type-modal__import"
                    onClick={() => {
                        setImportTestsModalTaskName(name);
                        setIsImportTestsModalShow(true);
                    }}
                >
                    <i className="bi bi-box-arrow-in-down" aria-hidden="true"></i>
                    <span>Импорт</span>
                </button>
            </div>
        );
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
            <span className="notification__item-inline-content">{assessmentTaskRusNameAliases[name]}</span>
        </button>
    );
};

interface SelectTypeModalProps {
    isShow: boolean;
    close: () => void;
    addTasks: TAddTasks;
}

const SelectTypeModal = ({ isShow, close, addTasks }: SelectTypeModalProps) => {
    const [isImportTestsModalShow, setIsImportTestsModalShow] = useState<boolean>(false);
    const [importTestsModalTaskName, setImportTestsModalTaskName] = useState<
        TAssessmentTaskName.TEST_SINGLE | TAssessmentTaskName.TEST_MULTI
    >(TAssessmentTaskName.TEST_SINGLE);

    return (
        <>
            <Modal size="xl" show={isShow} onHide={close} className="notifications-modal assessment-select-type-modal">
                <Modal.Header closeButton className="modal-bg">
                    <Modal.Title>Выбор задания</Modal.Title>
                </Modal.Header>
                <Modal.Body className="modal-bg">
                    <div className="assessment-select-type-modal__list">
                        {Object.values(TAssessmentTaskName).map((name) => (
                            <SelectTypeModalItem
                                key={name}
                                name={name}
                                addTasks={addTasks}
                                close={close}
                                setIsImportTestsModalShow={setIsImportTestsModalShow}
                                setImportTestsModalTaskName={setImportTestsModalTaskName}
                            />
                        ))}
                    </div>
                </Modal.Body>
            </Modal>
            <ImportTestsModalModal
                taskName={importTestsModalTaskName}
                isShow={isImportTestsModalShow}
                close={() => setIsImportTestsModalShow(false)}
                onSuccessfulImport={close}
                addTasks={(name: TAssessmentTaskName, taskData?: TTeacherAssessmentAnyItem[]) => {
                    addTasks(name, taskData);
                }}
            />
        </>
    );
};

export default SelectTypeModal;
