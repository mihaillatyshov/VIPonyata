import React, { useState } from "react";

import InputError from "components/Form/InputError";
import { TDictionaryItemCreate } from "models/TDictionary";
import Modal from "react-bootstrap/Modal";

import WordsTable from "./WordsTable";

interface TDictionaryItemCreateRaw {
    ru: string | null;
    word_jp: string | null;
    char_jp: string | null;
}

interface NewWordsModalProps {
    createNewWords: (words: TDictionaryItemCreate[], setError: (message: string) => void) => void;
    isShow: boolean;
    close: () => void;
    colToCheck: "word_jp" | "char_jp";
    defaultText: string;
    defaultPreview: TDictionaryItemCreate[];
}

const textareaPlaceholder = Array.from(Array(9).keys())
    .map((i) => `Рус_${i} \t\t Яп_слово_${i} \t\t Яп_символ_${i}`)
    .join("\n");

const NewWordsModal = ({
    createNewWords,
    isShow,
    close,
    colToCheck,
    defaultText,
    defaultPreview,
}: NewWordsModalProps) => {
    const [text, setText] = useState<string>(defaultText);
    const [preview, setPreview] = useState<TDictionaryItemCreate[]>(defaultPreview);
    const [error, setError] = useState<string>("");

    const checkCol = (lines: TDictionaryItemCreateRaw[]): lines is TDictionaryItemCreate[] => {
        for (const line of lines) {
            if (line[colToCheck] === null) {
                setError("Нужная колонка имеет пропуски!!!");
                return false;
            }
            if (line["ru"] === null) {
                setError("Столбец с переводом имеет пропуски!!!");
                return false;
            }
        }
        setError("");
        return true;
    };

    const testParseExcel = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const { value } = e.target;
        const lines = value
            .split("\n")
            .map((line) =>
                line
                    .split("\t")
                    .map((item) => item.trim())
                    .map((item) => (item === "" ? null : item)),
            )
            .filter((line) => line.length >= 2)
            .map((line) => ({ ru: line.at(0) ?? null, word_jp: line.at(1) ?? null, char_jp: line.at(2) ?? null }));

        setText(value);
        setPreview(checkCol(lines) ? lines : []);
    };

    const onClickHandler = () => {
        if (error !== "") {
            return;
        }
        createNewWords(preview, setError);
    };

    return (
        <Modal size="xl" show={isShow} onHide={close} dialogClassName="modal-dialog">
            <Modal.Header closeButton className="modal-bg">
                <Modal.Title>Импорт слов</Modal.Title>
            </Modal.Header>
            <Modal.Body className="modal-bg">
                <textarea
                    rows={10}
                    onChange={testParseExcel}
                    className="form-control"
                    placeholder={textareaPlaceholder}
                    value={text}
                ></textarea>
                <WordsTable words={preview} />
                <InputError message={error} className="mb-4" />
                <input className="btn btn-success" type="button" value="Добавить" onClick={onClickHandler} />
            </Modal.Body>
        </Modal>
    );
};

export default NewWordsModal;
