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
            dialogClassName="modal-dialog"
            contentClassName="modal-content-auto-height"
            centered
        >
            <Modal.Header closeButton className="modal-bg">
                <Modal.Title>待って！</Modal.Title>
            </Modal.Header>
            <Modal.Body className="modal-bg overflow-auto">
                <p>Здесь есть ошибки ^_^</p>
            </Modal.Body>
            <Modal.Footer className="modal-bg">
                <Button variant="secondary" onClick={onContinueWithoutFixing}>
                    Не буду исправлять
                </Button>
                <Button variant="primary" onClick={close}>
                    Попробую найти
                </Button>
            </Modal.Footer>
        </Modal>
    );
};
