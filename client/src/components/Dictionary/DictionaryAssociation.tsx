import React, { useState } from "react";

import InputError from "components/Form/InputError";
import { AjaxPost } from "libs/ServerAPI";
import { TextareaAutosize } from "libs/TextareaAutosize";

interface DictionaryAssociationProps {
    initValue: string | null;
    dictionary_id: number;
    onSuccessSave: (association: string) => void;
    className?: string;
}

const DictionaryAssociation = ({ initValue, dictionary_id, onSuccessSave, className }: DictionaryAssociationProps) => {
    const [isAssociationEdit, setIsAssociationEdit] = useState<boolean>(false);

    const [tmpAssociation, setTmpAssociation] = useState<string>(() => initValue ?? "");
    const [associationError, setAssociationError] = useState<string>(() => "");

    const handleChangeIsAssociationEdit = () => {
        if (isAssociationEdit) {
            AjaxPost({
                url: `/api/dictionary/${dictionary_id}/association`,
                body: { association: tmpAssociation },
            })
                .then(() => {
                    onSuccessSave(tmpAssociation);
                    setAssociationError("");
                    setIsAssociationEdit(false);
                })
                .catch(() => {
                    setAssociationError("Ошибка сервера");
                });
        } else {
            setIsAssociationEdit(true);
        }
    };
    return (
        <div className={className}>
            <div className="input-group">
                <TextareaAutosize
                    className="form-control"
                    value={tmpAssociation}
                    placeholder="Твоя ассоциация"
                    onChange={(e) => {
                        setTmpAssociation(e.currentTarget.value);
                    }}
                    disabled={!isAssociationEdit}
                    // ref={textAreaRef}
                    style={{ resize: "none" }}
                />
                <i
                    className={`bi font-icon-button input-group-text px-1 ${
                        isAssociationEdit ? "bi-check2-all" : "bi-pencil-square"
                    }`}
                    style={{ fontSize: "1.5em" }}
                    onClick={handleChangeIsAssociationEdit}
                />
            </div>
            <InputError message={associationError} />
        </div>
    );
};

export default DictionaryAssociation;
