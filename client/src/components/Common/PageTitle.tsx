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
            <i className="bi bi-arrow-left" />
        </div>
    );
};

interface PageTitleProps extends BackProps {
    title?: string;
    className?: string;
    rightElement?: React.ReactNode;
}

const PageTitle = ({ title, urlBack, className = "", rightElement }: PageTitleProps) => {
    return (
        <div>
            <div className={`${className} ${styles.pageTitle}`}>
                <Back urlBack={urlBack} />
                {title !== undefined ? (
                    <div className="mx-auto pe-2">{title}</div>
                ) : (
                    <div className="placeholder-wave w-100 lh-1" style={{ height: "var(--var-page-title-size)" }}>
                        <span className="placeholder w-100 bg-placeholder rounded lh-1 align-baseline"></span>
                    </div>
                )}
                {rightElement}
            </div>
        </div>
    );
};

export default PageTitle;
