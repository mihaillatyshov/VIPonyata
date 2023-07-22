import React from "react";
import InputText from "components/Form/InputText";
import InputSelect, { TOption } from "components/Form/InputSelect";
import InputImage from "components/Form/InputImage";

const colors: TOption[] = [
    { value: "", title: "Без цвета" },
    { value: "red", title: "Красный" },
    { value: "yellow", title: "Желтый" },
    { value: "green", title: "Зеленый" },
];

const CourseCreatePage = () => {
    return (
        <div className="container mt-5">
            <InputText
                placeholder="Название"
                htmlId="course-name"
                value=""
                onChangeHandler={() => {}}
                className="mt-4 mb-4"
            />
            <div className="row g-4">
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
            <InputImage htmlId="course-image" onChangeHandler={() => {}} placeholder="Картинка" />
        </div>
    );
};

export default CourseCreatePage;
