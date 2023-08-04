import React from "react";

import style from "./StyleCommon.module.css";

interface PageTitleProps {
    title?: string;
}

const PageTitle = ({ title }: PageTitleProps) => {
    return (
        <div className={style.pageTitle}>
            {title ?? (
                <div className="placeholder-wave w-100">
                    <span className="placeholder w-100 bg-light rounded"></span>
                </div>
            )}
        </div>
    );
};

export default PageTitle;
