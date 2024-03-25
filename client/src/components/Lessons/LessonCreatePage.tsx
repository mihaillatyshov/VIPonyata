import React from "react";

import { FloatingLabelTextareaAutosize } from "components/Form/FloatingLabelTextareaAutosize";
import { GetImg, GetStringOrNull } from "components/Form/InputBase";
import InputImage from "components/Form/InputImage";
import InputNumber from "components/Form/InputNumber";
import InputText from "components/Form/InputText";
import SubmitButton from "components/Form/SubmitButton";
import { useFormState } from "components/Form/useFormState";
import { AjaxPost } from "libs/ServerAPI";
import { ImageState } from "models/Img";
import { TLesson, TLessonCreate } from "models/TLesson";
import { useNavigate, useParams } from "react-router-dom";
import { ValidateEmpty, ValidateImgLoading } from "validators/FormValidators";

interface LessonForm {
    name: string;
    number: number;
    description: string;
    img: ImageState;
}

const defaults: LessonForm = {
    name: "",
    number: 500,
    description: "",
    img: { loadStatus: "NONE" },
};

const LessonCreatePage = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();

    const { inputs, validateForm, inputProps } = useFormState<LessonForm>(
        defaults,
        {},
        {
            name: ValidateEmpty,
            img: ValidateImgLoading,
        },
    );

    const onSubmitHandler = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!validateForm()) {
            return;
        }
        const lesson: TLessonCreate = {
            name: inputs.name.trim(),
            number: inputs.number,
            description: GetStringOrNull(inputs.description),
            img: GetImg(inputs.img),
        };
        AjaxPost<{ lesson: TLesson }>({ url: `/api/lessons/${courseId}`, body: lesson }).then((body) => {
            navigate(`/lessons/${body.lesson.id}`);
        });
    };

    return (
        <form className="container mt-5 d-flex flex-column" onSubmit={onSubmitHandler}>
            <InputText placeholder="Название" htmlId="course-name" className="mt-2" {...inputProps.name} />
            <InputNumber
                htmlId="course-sort"
                placeholder="Порядок соритровки"
                className="mt-2"
                {...inputProps.number}
            />
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

export default LessonCreatePage;
