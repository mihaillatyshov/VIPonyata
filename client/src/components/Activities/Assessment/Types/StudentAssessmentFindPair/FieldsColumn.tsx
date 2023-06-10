import React from "react";

interface FieldsColumnProps {
    fields: string[];
    selectedId: number | undefined;
    setSelectedId: (id: number | undefined) => void;
    pars_created: number;
}

const FieldsColumn = ({ fields, selectedId, setSelectedId, pars_created }: FieldsColumnProps) => {
    const getUsedClassName = () => {
        return "border border-success";
    };

    const getClassName = (id: number) => {
        return `m-2 
        ${id < pars_created || id === selectedId ? getUsedClassName() : ""}`;
    };

    const onClickHandle = (id: number) => {
        setSelectedId(selectedId === undefined || selectedId !== id ? id : undefined);
    };

    return (
        <div className="col-auto mx-4" style={{ border: "1px solid #000000" }}>
            {fields.map((element: string, i: number) => (
                <div
                    key={i}
                    className={getClassName(i)}
                    onClick={() => {
                        onClickHandle(i);
                    }}
                >
                    {element}
                </div>
            ))}
        </div>
    );
};

export default FieldsColumn;
