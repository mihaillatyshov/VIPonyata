import React from "react";

import CSS from "csstype";

import styles from "./StyleLoading.module.css";

export interface LoadingProps {
    size?: "s" | "m" | "l" | "xl" | "xxl" | number;
}

const Loading = ({ size }: LoadingProps = { size: "m" }) => {
    const textSize = typeof size === "number" ? "number" : size;
    const style: CSS.Properties =
        typeof size === "number"
            ? {
                  width: `${size}px`,
                  height: `${size}px`,
              }
            : {};

    return (
        <div className={styles.ldsDefaultContainer} data-size={textSize} style={style}>
            <div className={styles.ldsDefault}>
                {Array.from(Array(12)).map((_, i) => (
                    <div key={i}></div>
                ))}
            </div>
        </div>
    );
};

export default Loading;
