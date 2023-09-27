import React from "react";

import style from "./StyleCommon.module.css";
import { useNavigate } from "react-router-dom";

interface BackProps {
    urlBack?: string;
}

const Back = ({ urlBack }: BackProps) => {
    const navigate = useNavigate();

    if (urlBack === undefined) {
        return <></>;
    }

    return (
        <div onClick={() => navigate(urlBack)} className={style.pageTitleBack}>
            <i className="bi bi-arrow-bar-left" />
        </div>
    );
};

interface PageTitleProps extends BackProps {
    title?: string;
}

const PageTitle = ({ title, urlBack }: PageTitleProps) => {
    return (
        <>
            <div className={style.pageTitle}>
                <Back urlBack={urlBack} />
                {title ?? (
                    <div className="placeholder-wave w-100">
                        <span className="placeholder w-100 bg-light rounded"></span>
                    </div>
                )}
            </div>
        </>
    );
};

export default PageTitle;
