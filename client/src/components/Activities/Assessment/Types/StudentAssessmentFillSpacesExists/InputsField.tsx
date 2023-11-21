import React from "react";

import Draggable from "./Draggable";

interface InputsFieldProps {
    inputFields: string[];
    longestStr: string;
}

const InputsField = ({ inputFields, longestStr }: InputsFieldProps) => {
    return (
        <div className="d-flex gap-3 flex-wrap student-assessment-fill-spaces-exists__inputs">
            {inputFields.map((item, id) => (
                <Draggable key={id} id={id} str={item} longestStr={longestStr} type="inputs" />
            ))}
        </div>
    );
};

export default InputsField;
