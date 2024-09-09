import React, { useLayoutEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Loading from "components/Common/Loading";
import PageTitle from "components/Common/PageTitle";
import ErrorPage from "components/ErrorPages/ErrorPage";
import { FloatingLabelTextareaAutosize } from "components/Form/FloatingLabelTextareaAutosize";
import { GetImg, GetStringOrNull } from "components/Form/InputBase";
import InputError from "components/Form/InputError";
import InputImage from "components/Form/InputImage";
import InputNumber from "components/Form/InputNumber";
import InputSelect, { TOption } from "components/Form/InputSelect";
import InputText from "components/Form/InputText";
import { useFormState } from "components/Form/useFormState";
import { AjaxDelete, AjaxPatch, AjaxPost } from "libs/ServerAPI";
import { LoadStatus } from "libs/Status";
import { TProcessingType } from "models/Processing";
import { TCourseCreate } from "models/TCourse";
import { ProcessingButtonBlock } from "ui/Processing/ProcessingButtonBlock";
import { ValidateEmpty, ValidateImgLoading } from "validators/FormValidators";

import { CourseProcessingForm, getCourseProcessingData } from "./CourseProcessingUtils";

interface CourseProcessingResponse {
    course: {
        id: number;
    };
}

const colors: TOption[] = [
    { value: "", title: "Без цвета" },
    { value: "red", title: "Красный" },
    { value: "yellow", title: "Желтый" },
    { value: "green", title: "Зеленый" },
];

interface CourseProcessingPageProps {
    processingType: TProcessingType;
}

const CourseProcessingPage = ({ processingType }: CourseProcessingPageProps) => {
    const { id: idStr } = useParams();
    const id = parseInt(idStr || "0");

    const navigate = useNavigate();

    const [loadStatus, setLoadStatus] = useState<LoadStatus.Type>(LoadStatus.NONE);
    const [error, setError] = useState<string>("");

    const { inputs, validateForm, inputProps } = useFormState<CourseProcessingForm>(
        {
            name: "",
            difficulty: "",
            difficultyColor: "",
            sort: 500,
            description: "",
            img: { loadStatus: LoadStatus.NONE },
        },
        {},
        {
            name: ValidateEmpty,
            difficulty: ValidateEmpty,
            img: ValidateImgLoading,
        },
    );

    useLayoutEffect(() => {
        setLoadStatus(LoadStatus.LOADING);

        getCourseProcessingData(processingType, id).then((data) => {
            if (data.loadStatus === LoadStatus.DONE) {
                setLoadStatus(LoadStatus.DONE);
                inputProps.name.onChangeHandler(data.course.name);
                inputProps.difficulty.onChangeHandler(data.course.difficulty);
                inputProps.difficultyColor.onChangeHandler(data.course.difficultyColor ?? "");
                inputProps.sort.onChangeHandler(data.course.sort);
                inputProps.description.onChangeHandler(data.course.description ?? "");
                inputProps.img.onChangeHandler(data.course.img ?? { loadStatus: LoadStatus.NONE });
            } else {
                setError(data.message);
                if (data.needExitPage) {
                    navigate("/");
                }
                setLoadStatus(LoadStatus.ERROR);
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, processingType, navigate]);

    if (loadStatus === LoadStatus.ERROR) {
        return (
            <ErrorPage
                errorImg="/svg/SomethingWrong.svg"
                textMain={error}
                textDisabled="Попробуйте перезагрузить страницу"
            />
        );
    }

    if (loadStatus !== LoadStatus.DONE) {
        return (
            <div className="container d-flex flex-column justify-content-center align-items-center">
                <PageTitle title="コース" />
                <Loading size="xxl" />
            </div>
        );
    }

    const handleProcessing = () => {
        const ajaxMethod = processingType === "edit" ? AjaxPatch : AjaxPost;

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

        ajaxMethod<CourseProcessingResponse>({
            url: processingType === "edit" ? `/api/courses/${id}` : "/api/courses",
            body: course,
        }).then((body) => {
            navigate(`/courses/${body.course.id}`);
        });
    };

    const handleDelete = () => {
        AjaxDelete({ url: `/api/courses/${id}` })
            .then(() => {
                navigate("/");
            })
            .catch(() => {
                setError("Необходимо удалить все уроки в этом курсе (Или нет соединения)");
            });
    };

    return (
        <div className="container mb-5 pb-5">
            <PageTitle title="コース" urlBack="/" />
            <div className="container mt-5 d-flex flex-column">
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
                <InputNumber
                    htmlId="course-sort"
                    placeholder="Порядок соритровки"
                    className="mt-2"
                    {...inputProps.sort}
                />
                <FloatingLabelTextareaAutosize
                    htmlId="course-description"
                    {...inputProps.description}
                    placeholder="Описание"
                    className="mt-2"
                    rows={6}
                />
                <InputImage htmlId="course-image" placeholder="Картинка" className="mt-2" {...inputProps.img} />

                <div>
                    <ProcessingButtonBlock
                        onSubmit={handleProcessing}
                        onDelete={handleDelete}
                        processingType={processingType}
                    />
                    <InputError message={error} />
                </div>
            </div>
        </div>
    );
};

export const CourseCreatePage = () => {
    return <CourseProcessingPage processingType="create" />;
};

export const CourseEditPage = () => {
    return <CourseProcessingPage processingType="edit" />;
};
