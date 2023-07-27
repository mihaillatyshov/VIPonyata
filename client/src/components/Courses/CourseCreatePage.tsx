import React from "react";
import InputText from "components/Form/InputText";
import InputSelect, { TOption } from "components/Form/InputSelect";
import InputImage from "components/Form/InputImage";
import { ImageState } from "models/Img";
import InputNumber from "components/Form/InputNumber";
import InputTextArea from "components/Form/InputTextArea";
import SubmitButton from "components/Form/SubmitButton";
import { useFormState } from "components/Form/useFormState";
import { ValidateEmpty, ValidateImgLoading } from "validators/FormValidators";
import { AjaxPost } from "libs/ServerAPI";
import { TCourse, TCourseCreate } from "models/TCourse";
import { GetImg, GetStringOrNull } from "components/Form/InputBase";
import { useNavigate } from "react-router-dom";

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

const defaults: CourseForm = {
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
        defaults,
        {},
        {
            name: ValidateEmpty,
            difficulty: ValidateEmpty,
            img: ValidateImgLoading,
        }
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
            <InputTextArea
                htmlId="course-description"
                {...inputProps.description}
                placeholder="Описание"
                className="mt-2"
                rows={10}
            />
            <InputImage htmlId="course-image" placeholder="Картинка" className="mt-2" {...inputProps.img} />
            <SubmitButton value="Создать" className="btn-success mt-4" />
        </form>
    );
};

export default CourseCreatePage;
