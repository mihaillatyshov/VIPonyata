import React from "react";

import { FloatingLabelTextareaAutosize } from "components/Form/FloatingLabelTextareaAutosize";
import { GetImg, GetStringOrNull } from "components/Form/InputBase";
import InputImage from "components/Form/InputImage";
import InputNumber from "components/Form/InputNumber";
import InputSelect, { TOption } from "components/Form/InputSelect";
import InputText from "components/Form/InputText";
import SubmitButton from "components/Form/SubmitButton";
import { useFormState } from "components/Form/useFormState";
import { AjaxPost } from "libs/ServerAPI";
import { ImageState } from "models/Img";
import { TCourse, TCourseCreate } from "models/TCourse";
import { useNavigate } from "react-router-dom";
import { ValidateEmpty, ValidateImgLoading } from "validators/FormValidators";

const colors: TOption[] = [
    { value: "", title: "Без цвета" },
    { value: "red", title: "Красный" },
    { value: "yellow", title: "Желтый" },
    { value: "green", title: "Зеленый" },
];

interface CourseForm {
    name: string;
    difficulty: string;
    difficultyColor: string;
    sort: number;
    description: string;
    img: ImageState;
}

const defaultForm: CourseForm = {
    name: "",
    difficulty: "",
    difficultyColor: "",
    sort: 500,
    description: "",
    img: { loadStatus: "NONE" },
};

const CourseCreatePage = () => {
    const navigate = useNavigate();

    const { inputs, validateForm, inputProps } = useFormState<CourseForm>(
        { ...defaultForm },
        {},
        {
            name: ValidateEmpty,
            difficulty: ValidateEmpty,
            img: ValidateImgLoading,
        },
    );

    const onSubmitHandler = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!validateForm()) {
            return;
        }
        const course: TCourseCreate = {
            name: inputs.name.trim(),
            difficulty: inputs.difficulty.trim(),
            difficulty_color: GetStringOrNull(inputs.difficultyColor),
            sort: inputs.sort,
            description: GetStringOrNull(inputs.description),
            img: GetImg(inputs.img),
        };
        AjaxPost<{ course: TCourse }>({ url: "/api/courses", body: course }).then((body) => {
            navigate(`/courses/${body.course.id}`);
        });
    };

    return (
        <form className="container mt-5 d-flex flex-column" onSubmit={onSubmitHandler}>
            <InputText placeholder="Название" htmlId="course-name" className="mt-2" {...inputProps.name} />
            <div className="row gx-4 mt-2">
                <div className="col-md">
                    <InputText placeholder="Сложность" htmlId="course-difficulty" {...inputProps.difficulty} />
                </div>
                <div className="col-md">
                    <InputSelect
                        placeholder="Цвет"
                        htmlId="course-difficulty-color"
                        options={colors}
                        {...inputProps.difficultyColor}
                    />
                </div>
            </div>
            <InputNumber htmlId="course-sort" placeholder="Порядок соритровки" className="mt-2" {...inputProps.sort} />
            <FloatingLabelTextareaAutosize
                htmlId="course-description"
                {...inputProps.description}
                placeholder="Описание"
                className="mt-2"
                rows={6}
            />
            <InputImage htmlId="course-image" placeholder="Картинка" className="mt-2" {...inputProps.img} />
            <SubmitButton value="Создать" className="btn-success mt-4" />
        </form>
    );
};

export default CourseCreatePage;
