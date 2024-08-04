import React, { useEffect } from "react";
import {
    assessmentTaskRusNameAliases,
    TAssessmentTaskName,
    TTeacherAssessmentAnyItem,
    TTeacherAssessmentTestMulti,
    TTeacherAssessmentTestSingle,
} from "models/Activity/Items/TAssessmentItems";
import Modal from "react-bootstrap/Modal";
import { FloatingLabelTextareaAutosize } from "components/Form/FloatingLabelTextareaAutosize";

interface ImportTestsModalProps {
    taskName: TAssessmentTaskName.TEST_SINGLE | TAssessmentTaskName.TEST_MULTI;
    isShow: boolean;
    close: () => void;
    onSuccessfulImport: () => void;
    addTasks: (name: TAssessmentTaskName, taskData?: TTeacherAssessmentAnyItem[]) => void;
}

export const ImportTestsModalModal = ({
    taskName,
    isShow,
    close: closeModal,
    onSuccessfulImport,
    addTasks,
}: ImportTestsModalProps) => {
    const [text, setText] = React.useState<string>("");
    const [parsedTasks, setParsedTasks] = React.useState<
        (TTeacherAssessmentTestSingle | TTeacherAssessmentTestMulti)[]
    >([]);

    useEffect(() => {
        const result: (TTeacherAssessmentTestSingle | TTeacherAssessmentTestMulti)[] = [];
        text.split("\n").forEach((line) => {
            console.log(line);
            const trimmedLine = line.trim();
            if (trimmedLine === "") {
                return;
            }

            if (trimmedLine.match(/^\d+\)\t/)) {
                if (taskName === TAssessmentTaskName.TEST_SINGLE) {
                    result.push({
                        name: taskName,
                        question: trimmedLine.replace(/^\d+\)\t/, "").trim(),
                        options: [],
                        meta_answer: null,
                    });
                } else if (taskName === TAssessmentTaskName.TEST_MULTI) {
                    result.push({
                        name: taskName,
                        question: trimmedLine.replace(/^\d+\)\t/, "").trim(),
                        options: [],
                        meta_answers: [],
                    });
                }
            } else if (trimmedLine.match(/^\d+\.\t/)) {
                result[result.length - 1].options.push(trimmedLine.replace(/^\d+\.\t/, "").trim());
            }
        });
        setParsedTasks(result);
    }, [taskName, text]);

    const close = () => {
        setText("");
        setParsedTasks([]);
        closeModal();
    };

    const addAllImportedTasks = () => {
        addTasks(taskName, parsedTasks);
        close();
        onSuccessfulImport();
    };

    return (
        <Modal
            fullscreen={true}
            show={isShow}
            onHide={close}
            className="w-100 h-100"
            dialogClassName="w-100 h-100"
            contentClassName="modal-content-fullscreen"
        >
            <Modal.Header closeButton className="modal-bg">
                <Modal.Title>Импорт теста ({assessmentTaskRusNameAliases[taskName]})</Modal.Title>
            </Modal.Header>
            <Modal.Body className="modal-bg">
                <FloatingLabelTextareaAutosize
                    htmlId="import-test-textarea"
                    placeholder="Список из Word"
                    value={text}
                    onChangeHandler={(str) => setText(str)}
                    rows={6}
                    autoFocus={true}
                    noErrorField={true}
                />
                <div className="fw-bold mt-2">Результат</div>
                <div className="flex flex-column g-4">
                    {parsedTasks.map((task, i) => (
                        <div key={i}>
                            <div className="fw-bold">{`${i + 1}) ${task.question}`}</div>
                            <div className="flex flex-column g-2 ps-3">
                                {task.options.map((option, j) => (
                                    <div key={j}>{`${j + 1}. ${option}`}</div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </Modal.Body>
            <Modal.Footer className="modal-bg">
                <input type="button" className="btn btn-success w-100" onClick={addAllImportedTasks} value="Добавить" />
            </Modal.Footer>
        </Modal>
    );
};
