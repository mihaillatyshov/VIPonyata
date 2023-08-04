import React from "react";

import styles from "./StyleLoading.module.css";

export interface LoadingProps {
    size?: "s" | "m" | "l" | "xl" | "xxl";
}

const Loading = ({ size }: LoadingProps = { size: "m" }) => {
    return (
        <div className={styles.ldsDefaultContainer} data-size={size}>
            <div className={styles.ldsDefault}>
                {Array.from(Array(12)).map((_, i) => (
                    <div key={i}></div>
                ))}
            </div>
        </div>
    );
};

export default Loading;
