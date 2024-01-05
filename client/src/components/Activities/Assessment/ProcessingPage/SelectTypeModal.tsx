import React from "react";
import { TAssessmentTaskName, assessmentTaskRusNameAliases } from "models/Activity/Items/TAssessmentItems";
import Modal from "react-bootstrap/Modal";

interface SelectTypeModalProps {
    isShow: boolean;
    close: () => void;
    addTask: (name: TAssessmentTaskName) => void;
}

const SelectTypeModal = ({ isShow, close, addTask }: SelectTypeModalProps) => {
    return (
        <Modal size="xl" show={isShow} onHide={close} dialogClassName="modal-dialog">
            <Modal.Header closeButton className="modal-bg">
                <Modal.Title>Выбор задания</Modal.Title>
            </Modal.Header>
            <Modal.Body className="modal-bg">
                <div className="btn-group-vertical w-100 mb-4">
                    {Object.values(TAssessmentTaskName).map((name) => (
                        <input
                            key={name}
                            type="button"
                            className="btn btn-outline-secondary btn-lg w-50 mx-auto"
                            value={assessmentTaskRusNameAliases[name]}
                            onClick={() => {
                                addTask(name);
                                close();
                            }}
                        />
                    ))}
                </div>
            </Modal.Body>
        </Modal>
    );
};

export default SelectTypeModal;
