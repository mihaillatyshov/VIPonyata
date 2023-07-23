import React, { useState } from "react";
import InputText from "components/Form/InputText";
import InputSelect, { TOption } from "components/Form/InputSelect";
import InputImage from "components/Form/InputImage";
import { ImageState } from "models/Img";

const colors: TOption[] = [
    { value: "", title: "Без цвета" },
    { value: "red", title: "Красный" },
    { value: "yellow", title: "Желтый" },
    { value: "green", title: "Зеленый" },
];

const CourseCreatePage = () => {
    const [img, setImg] = useState<ImageState>({ loadStatus: "NONE" });

    return (
        <div className="container mt-5 d-flex flex-column">
            <InputText
                placeholder="Название"
                htmlId="course-name"
                value=""
                onChangeHandler={() => {}}
                className="mt-4"
            />
            <div className="row gx-4 mt-4">
                <div className="col-md">
                    <InputText placeholder="Сложность" htmlId="course-difficulty" value="" onChangeHandler={() => {}} />
                </div>
                <div className="col-md">
                    <InputSelect
                        placeholder="Цвет"
                        htmlId="course-difficulty-color"
                        value=""
                        options={colors}
                        onChangeHandler={() => {}}
                    />
                </div>
            </div>
            <InputImage
                htmlId="course-image"
                onChangeHandler={setImg}
                value={img}
                placeholder="Картинка"
                className="mt-4"
            />
        </div>
    );
};

export default CourseCreatePage;
