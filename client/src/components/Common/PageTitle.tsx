import React from "react";

import { useNavigate } from "react-router-dom";

import styles from "./StyleCommon.module.css";

interface BackProps {
    urlBack?: string;
}

const Back = ({ urlBack }: BackProps) => {
    const navigate = useNavigate();

    if (urlBack === undefined) {
        return <></>;
    }

    return (
        <div onClick={() => navigate(urlBack)} className={styles.pageTitleBack}>
            <i className="bi bi-arrow-bar-left" />
        </div>
    );
};

interface PageTitleProps extends BackProps {
    title?: string;
}

const PageTitle = ({ title, urlBack }: PageTitleProps) => {
    return (
        <div className={styles.pageTitle}>
            <Back urlBack={urlBack} />
            {title !== undefined ? (
                <div className="mx-auto pe-2">{title}</div>
            ) : (
                <div className="placeholder-wave w-100">
                    <span className="placeholder w-100 bg-placeholder rounded"></span>
                </div>
            )}
        </div>
    );
};

export default PageTitle;
