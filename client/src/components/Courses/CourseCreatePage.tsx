import React, { FormEvent, useState } from "react";
import InputText from "components/Form/InputText";
import InputSelect, { TOption } from "components/Form/InputSelect";
import InputImage from "components/Form/InputImage";
import { ImageState } from "models/Img";
import InputNumber from "components/Form/InputNumber";
import InputTextArea from "components/Form/InputTextArea";
import SubmitButton from "components/Form/SubmitButton";
import { useFormState } from "components/Form/InputBase";
import { ValidateEmpty } from "validators/FormValidators";

const colors: TOption[] = [
    { value: "", title: "Без цвета" },
    { value: "red", title: "Красный" },
    { value: "yellow", title: "Желтый" },
    { value: "green", title: "Зеленый" },
];

interface CourseForm {
    name: string;
    difficulty: string;
    difficultyColor: string | null;
    sort: number;
    description: string;
    img: ImageState;
}

const defaults: CourseForm = {
    name: "",
    difficulty: "",
    difficultyColor: null,
    sort: 500,
    description: "",
    img: { loadStatus: "NONE" },
};

const CourseCreatePage = () => {
    const { inputs, handlers, validators, errors, inputProps } = useFormState<CourseForm>(
        defaults,
        {
            difficultyColor: (val: string) => (val === "" ? null : val),
        },
        {
            name: ValidateEmpty,
            difficulty: ValidateEmpty,
        }
    );

    // const [name, setName] = useState<string>("");
    // const [difficulty, setDifficulty] = useState<string>("");
    // const [difficultyColor, setDifficultyColor] = useState<string | null>(null);
    // const [sort, setSort] = useState<number>(500);
    // const [description, setDescription] = useState<string>("");
    // const [img, setImg] = useState<ImageState>({ loadStatus: "NONE" });

    const onSubmitHandler = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
    };

    // const onDifficultyColorChaneHandler = (value: string) => {
    //     setDifficultyColor(value === "" ? null : value);
    // };

    return (
        <form className="container mt-5 d-flex flex-column" onSubmit={onSubmitHandler}>
            <InputText placeholder="Название" htmlId="course-name" {...inputProps.name} className="mt-2" />
            <div className="row gx-4 mt-2">
                <div className="col-md">
                    <InputText placeholder="Сложность" htmlId="course-difficulty" {...inputProps.difficulty} />
                </div>
                <div className="col-md">
                    <InputSelect
                        placeholder="Цвет"
                        htmlId="course-difficulty-color"
                        value={inputs.difficultyColor ?? ""}
                        errorMessage={errors.difficultyColor}
                        options={colors}
                        onChangeHandler={handlers.difficultyColor}
                    />
                </div>
            </div>
            <InputNumber htmlId="course-sort" {...inputProps.sort} placeholder="Порядок соритровки" className="mt-2" />
            <InputTextArea
                htmlId="course-description"
                {...inputProps.description}
                placeholder="Описание"
                className="mt-2"
                rows={10}
            />
            <InputImage htmlId="course-image" {...inputProps.img} placeholder="Картинка" className="mt-2" />
            <SubmitButton value="Создать" className="btn-success mt-4" />
        </form>
    );
};

export default CourseCreatePage;
