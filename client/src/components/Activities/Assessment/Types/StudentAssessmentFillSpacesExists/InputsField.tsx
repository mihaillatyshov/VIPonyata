import React from "react";
import Draggable from "./Draggable";

interface InputsFieldProps {
    inputFields: string[];
    width: number;
}

const InputsField = ({ inputFields, width }: InputsFieldProps) => {
    return (
        <div className="d-flex gap-3 flex-wrap">
            {inputFields.map((item, id) => (
                <Draggable key={id} id={id} str={item} width={width} type="inputs"></Draggable>
            ))}
        </div>
    );
};

export default InputsField;
