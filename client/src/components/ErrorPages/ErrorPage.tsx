import React from "react";
import { useNavigate } from "react-router-dom";
import style from "./StyleError.module.css";

interface ErrorPageProps {
    errorImg: string;
    textMain: string;
    textDisabled?: string;
    needReload?: boolean;
}

const ErrorPage = ({ errorImg, textMain, textDisabled, needReload }: ErrorPageProps) => {
    const navigate = useNavigate();

    needReload = needReload ?? true;

    return (
        <div className={style.errorBlock}>
            <img src={errorImg} alt="" />
            <div className={style.errorBlockTextMain}> {textMain} </div>
            <div className={style.errorBlockTextDisabled}> {textDisabled} </div>
            {needReload && (
                <input
                    className="button button--second"
                    type="button"
                    value="Перезагрузить"
                    onClick={() => {
                        navigate(0);
                    }}
                />
            )}
        </div>
    );
};

export default ErrorPage;