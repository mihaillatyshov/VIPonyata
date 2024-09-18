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
import InputText from "components/Form/InputText";
import { useFormState } from "components/Form/useFormState";
import { AjaxDelete, AjaxPatch, AjaxPost } from "libs/ServerAPI";
import { LoadStatus } from "libs/Status";
import { TProcessingType } from "models/Processing";
import { TLessonCreate } from "models/TLesson";
import { ProcessingButtonBlock } from "ui/Processing/ProcessingButtonBlock";
import { ValidateEmpty, ValidateImgLoading } from "validators/FormValidators";

import { getLessonProcessingData, LessonProcessingForm } from "./LessonProcessingUtils";

interface LessonProcessingResponse {
    lesson: {
        id: number;
    };
}

interface LessonProcessingPageProps {
    processingType: TProcessingType;
}

const LessonProcessingPage = ({ processingType }: LessonProcessingPageProps) => {
    const { id: idStr } = useParams();
    const id = parseInt(idStr as string);

    const navigate = useNavigate();

    const [loadStatus, setLoadStatus] = useState<LoadStatus.Type>(LoadStatus.NONE);
    const [error, setError] = useState<string>("");

    const [courseId, setCourseId] = useState<number>(0);

    const { inputs, validateForm, inputProps } = useFormState<LessonProcessingForm>(
        {
            name: "",
            description: "",
            number: 0,
            img: { loadStatus: LoadStatus.NONE },
        },
        {},
        {
            name: ValidateEmpty,
            img: ValidateImgLoading,
        },
    );

    useLayoutEffect(() => {
        setLoadStatus(LoadStatus.LOADING);

        getLessonProcessingData(processingType, id).then((data) => {
            if (data.loadStatus === LoadStatus.DONE) {
                setCourseId(data.courseId);
                setLoadStatus(LoadStatus.DONE);
                inputProps.name.onChangeHandler(data.lesson.name);
                inputProps.number.onChangeHandler(data.lesson.number);
                inputProps.description.onChangeHandler(data.lesson.description ?? "");
                inputProps.img.onChangeHandler(data.lesson.img ?? { loadStatus: LoadStatus.NONE });
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
                <PageTitle title="授業" />
                <Loading size="xxl" />
            </div>
        );
    }

    const handleProcessing = () => {
        const ajaxMethod = processingType === "edit" ? AjaxPatch : AjaxPost;

        if (!validateForm()) {
            return;
        }

        const lesson: TLessonCreate = {
            name: inputs.name,
            description: GetStringOrNull(inputs.description),
            number: inputs.number,
            img: GetImg(inputs.img),
        };

        ajaxMethod<LessonProcessingResponse>({
            url: `/api/lessons/${id}`,
            body: lesson,
        })
            .then((body) => {
                navigate(`/lessons/${body.lesson.id}`);
            })
            .catch(({ isServerError, response, json }) => {
                if (!isServerError) {
                    if (response.status === 404 || response.status === 403) navigate("/");
                    else setError("Неизвестная ошибка");
                } else setError("Ошибка соединения");
            });
    };

    const handleDelete = () => {
        AjaxDelete({ url: `/api/lessons/${id}` })
            .then(() => {
                navigate(`/courses/${courseId}`);
            })
            .catch(() => {
                setError("Необходимо удалить все задания в этом уроке (Или нет соединения)");
            });
    };

    return (
        <div className="container mb-5 pb-5">
            <PageTitle title="授業" urlBack={`/courses/${courseId}`} />
            <div className="container mt-5 d-flex flex-column">
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

export const LessonCreatePage = () => {
    return <LessonProcessingPage processingType="create" />;
};

export const LessonEditPage = () => {
    return <LessonProcessingPage processingType="edit" />;
};
