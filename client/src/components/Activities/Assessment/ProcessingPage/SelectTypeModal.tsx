import React, { useState } from "react";
import Modal from "react-bootstrap/Modal";

import {
    assessmentTaskRusNameAliases,
    TAssessmentTaskName,
    TTeacherAssessmentAnyItem,
} from "models/Activity/Items/TAssessmentItems";

import { ImportTestsModalModal } from "./ImportTestsModal";

type TAddTasks = (name: TAssessmentTaskName, taskData?: TTeacherAssessmentAnyItem[]) => void;

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
            <div className="btn-group w-50 mx-auto">
                <input
                    type="button"
                    className="btn btn-outline-secondary btn-lg w-75 mx-auto text-wrap text-break"
                    value={assessmentTaskRusNameAliases[name]}
                    onClick={() => {
                        addTasks(name);
                        close();
                    }}
                />
                <input
                    className="btn btn-outline-secondary btn-lg w-25 mx-auto text-wrap text-break"
                    type="button"
                    value="Импорт"
                    onClick={() => {
                        setImportTestsModalTaskName(name);
                        setIsImportTestsModalShow(true);
                    }}
                />
            </div>
        );
    }

    return (
        <input
            type="button"
            className="btn btn-outline-secondary btn-lg w-50 mx-auto text-wrap text-break"
            value={assessmentTaskRusNameAliases[name]}
            onClick={() => {
                addTasks(name);
                close();
            }}
        />
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
            <Modal size="xl" show={isShow} onHide={close} dialogClassName="modal-dialog">
                <Modal.Header closeButton className="modal-bg">
                    <Modal.Title>Выбор задания</Modal.Title>
                </Modal.Header>
                <Modal.Body className="modal-bg">
                    <div className="btn-group-vertical mb-4 w-100">
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
                <Modal.Footer className="modal-bg"></Modal.Footer>
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
