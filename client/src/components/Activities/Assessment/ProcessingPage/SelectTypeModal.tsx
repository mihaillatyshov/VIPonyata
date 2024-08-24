import React, { useState } from "react";
import Modal from "react-bootstrap/Modal";

import {
    assessmentTaskRusNameAliases,
    TAssessmentTaskName,
    TTeacherAssessmentAnyItem,
} from "models/Activity/Items/TAssessmentItems";

import { ImportTestsModalModal } from "./ImportTestsModal";

interface SelectTypeModalProps {
    isShow: boolean;
    close: () => void;
    addTasks: (name: TAssessmentTaskName, taskData?: TTeacherAssessmentAnyItem[]) => void;
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
                        {Object.values(TAssessmentTaskName).map((name) =>
                            name === TAssessmentTaskName.TEST_SINGLE || name === TAssessmentTaskName.TEST_MULTI ? (
                                <div key={name} className="btn-group w-50 mx-auto">
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
                            ) : (
                                <input
                                    key={name}
                                    type="button"
                                    className="btn btn-outline-secondary btn-lg w-50 mx-auto text-wrap text-break"
                                    value={assessmentTaskRusNameAliases[name]}
                                    onClick={() => {
                                        addTasks(name);
                                        close();
                                    }}
                                />
                            ),
                        )}
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
