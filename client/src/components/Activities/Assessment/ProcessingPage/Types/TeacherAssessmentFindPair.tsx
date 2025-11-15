import React, { useLayoutEffect, useState } from "react";
import { Modal } from "react-bootstrap";

import { TextareaAutosize } from "libs/TextareaAutosize";
import { TTeacherAssessmentFindPair } from "models/Activity/Items/TAssessmentItems";

import styles from "./Style.module.css";
import { TeacherAssessmentTypeProps } from "./TeacherAssessmentTypeBase";

type TColNames = "meta_first" | "meta_second";

const zip = (meta_first: string[], meta_second: string[]): string[][] => {
    return meta_first.map((el, i) => [el, meta_second[i]]);
};

interface ImportExcelModalProps {
    isShow: boolean;
    close: () => void;
    defaultData: [string[], string[]];
    updateDataHandler: (cols: [string[], string[]]) => void;
}

const colsToText = (cols: [string[], string[]]) => {
    return zip(cols[0], cols[1])
        .map((row) => `${row[0]}\t${row[1]}`)
        .join("\n");
};

const ImportExcelModal = ({ isShow, close, defaultData, updateDataHandler }: ImportExcelModalProps) => {
    const [text, setText] = useState<string>(colsToText(defaultData));
    const [cols, setCols] = useState<[string[], string[]]>(defaultData);

    useLayoutEffect(() => {
        setCols(defaultData);
        setText(colsToText(defaultData));
    }, [defaultData]);

    const parseExcel = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const lines = e.target.value.split("\n").filter((line) => line.trim() !== "");
        const col1: string[] = [];
        const col2: string[] = [];
        lines.forEach((line) => {
            const [first = "", second = ""] = line.split("\t");
            col1.push(first);
            col2.push(second);
        });
        setCols([col1, col2]);
        setText(e.target.value);
    };

    return (
        <>
            <Modal size="xl" show={isShow} onHide={close} dialogClassName="modal-dialog">
                <Modal.Header closeButton className="modal-bg">
                    <Modal.Title>Импорт "Создай пару" из Excel</Modal.Title>
                </Modal.Header>
                <Modal.Body className="modal-bg" style={{ "--css-var-table-header": "#1976d2" } as React.CSSProperties}>
                    <TextareaAutosize
                        rows={10}
                        onChange={parseExcel}
                        className="form-control"
                        placeholder={"1_1\t2_1\n1_2\t2_2\n1_3\t2_3\n1_4\t2_4\n"}
                        value={text}
                    />

                    <div className="table-container">
                        <div className={`row ${styles.tableHeader}`}>
                            <div className="col-6">
                                <div className="d-flex justify-content-center">Первый столбец</div>
                            </div>
                            <div className="col-6">
                                <div className="d-flex justify-content-center">Второй столбец</div>
                            </div>
                        </div>
                        {zip(cols[0], cols[1]).map(([meta_first, meta_second], i) => (
                            <>
                                <div key={i} className="d-flex">
                                    <div className="col-6 d-flex align-items-center justify-content-center fs-5 h-100 p-2">
                                        {meta_first}
                                    </div>
                                    <div className="col-6 d-flex align-items-center justify-content-center fs-5 h-100 p-2">
                                        {meta_second}
                                    </div>
                                </div>
                                <hr className="m-0 p-0" />
                            </>
                        ))}
                    </div>
                    <input
                        className="btn btn-success"
                        type="button"
                        value="Добавить"
                        onClick={() => {
                            updateDataHandler(cols);
                            close();
                        }}
                    />
                </Modal.Body>
                <Modal.Footer className="modal-bg"></Modal.Footer>
            </Modal>
        </>
    );
};

interface CellProps {
    value: string;
    colName: TColNames;
    rowId: number;
    onChange: (newValue: string, colName: TColNames, rowId: number) => void;
}

const Cell = ({ value, colName, rowId, onChange }: CellProps) => {
    return (
        <div className="col-5">
            <div className="d-flex justify-content-center">
                <input
                    type="text"
                    className="form-control"
                    value={value}
                    onChange={(e) => onChange(e.target.value, colName, rowId)}
                    autoFocus={colName === "meta_first"}
                />
            </div>
        </div>
    );
};

const TeacherAssessmentFindPair = ({
    data,
    taskUUID,
    onChangeTask,
}: TeacherAssessmentTypeProps<TTeacherAssessmentFindPair>) => {
    const [isShowImportExcelModal, setIsShowImportExcelModal] = useState<boolean>(false);

    const onTextChangeHandler = (newValue: string, colName: TColNames, rowId: number) => {
        const newCol = data[colName];
        newCol[rowId] = newValue;
        onChangeTask({ ...data, [colName]: newCol });
    };

    const addLine = () => {
        onChangeTask({ ...data, meta_first: [...data.meta_first, ""], meta_second: [...data.meta_second, ""] });
    };

    const removeLine = (rowId: number) => {
        const newFirst = [...data.meta_first];
        const newSecond = [...data.meta_second];
        newFirst.splice(rowId, 1);
        newSecond.splice(rowId, 1);
        onChangeTask({ ...data, meta_first: newFirst, meta_second: newSecond });
    };

    const setNewCols = (cols: [string[], string[]]) => {
        onChangeTask({ ...data, meta_first: [...cols[0]], meta_second: [...cols[1]] });
    };

    return (
        <div className={styles.findPair}>
            <button className="btn btn-success w-100 mb-3" onClick={() => setIsShowImportExcelModal(true)}>
                Импортировать из Excel
            </button>
            <div className={`row ${styles.tableHeader}`}>
                <div className="col-5">
                    <div className="d-flex justify-content-center">Первый столбец</div>
                </div>
                <div className="col-2"></div>
                <div className="col-5">
                    <div className="d-flex justify-content-center">Второй столбец</div>
                </div>
            </div>
            {zip(data.meta_first, data.meta_second).map(([meta_first, meta_second], i) => (
                <div key={i} className={`row ${styles.tableRow}`}>
                    <Cell colName="meta_first" value={meta_first} rowId={i} onChange={onTextChangeHandler} />
                    <div className="col-2">
                        <div className="d-flex justify-content-center">
                            <i
                                className="bi bi-x font-icon-height-0 font-icon-button-danger"
                                style={{ fontSize: "2.3em" }}
                                onClick={() => removeLine(i)}
                            />
                        </div>
                    </div>
                    <Cell colName="meta_second" value={meta_second} rowId={i} onChange={onTextChangeHandler} />
                </div>
            ))}
            <div className="d-flex justify-content-center mt-3">
                <button className="btn btn-outline-dark btn-sm d-flex" onClick={addLine}>
                    <i className="bi bi-plus-lg" />
                    Добавить строку
                </button>
            </div>
            <ImportExcelModal
                isShow={isShowImportExcelModal}
                close={() => setIsShowImportExcelModal(false)}
                defaultData={[data.meta_first, data.meta_second]}
                updateDataHandler={setNewCols}
            />
        </div>
    );
};

export default TeacherAssessmentFindPair;
