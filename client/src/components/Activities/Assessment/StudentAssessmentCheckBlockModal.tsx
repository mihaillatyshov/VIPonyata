import { Button, Modal } from "react-bootstrap";

interface StudentAssessmentCheckBlockModalProps {
    isShow: boolean;
    close: () => void;
    onContinueWithoutFixing?: () => void;
}

export const StudentAssessmentCheckBlockModal = ({
    isShow,
    close,
    onContinueWithoutFixing,
}: StudentAssessmentCheckBlockModalProps) => {
    return (
        <Modal
            show={isShow}
            onHide={close}
            dialogClassName="modal-dialog student-assessment-check-modal"
            contentClassName="modal-content-auto-height student-assessment-check-modal__content"
            centered
        >
            <Modal.Header closeButton className="modal-bg student-assessment-check-modal__section">
                <Modal.Title className="student-assessment-check-modal__title">待って！</Modal.Title>
            </Modal.Header>
            <Modal.Body className="modal-bg overflow-auto student-assessment-check-modal__section">
                <p>Здесь есть ошибки ^_^</p>
            </Modal.Body>
            <Modal.Footer className="modal-bg student-assessment-check-modal__section">
                <Button variant="secondary" className="student-assessment-back-btn" onClick={onContinueWithoutFixing}>
                    Не буду исправлять
                </Button>
                <Button variant="primary" onClick={close}>
                    Попробую найти
                </Button>
            </Modal.Footer>
        </Modal>
    );
};
