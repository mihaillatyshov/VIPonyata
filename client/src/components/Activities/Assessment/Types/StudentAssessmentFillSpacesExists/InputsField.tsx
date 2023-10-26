import React from "react";

import styles from "../StyleAssessmentType.module.css";
import Draggable from "./Draggable";

interface InputsFieldProps {
    inputFields: string[];
    width: number;
}

const InputsField = ({ inputFields, width }: InputsFieldProps) => {
    return (
        <div className={`d-flex gap-3 flex-wrap ${styles.fillSpaceExistsInputs}`}>
            {inputFields.map((item, id) => (
                <Draggable key={id} id={id} str={item} width={width} type="inputs" />
            ))}
        </div>
    );
};

export default InputsField;
