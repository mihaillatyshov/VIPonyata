import React, { CSSProperties } from "react";
import { ProgressBar } from "react-bootstrap";

type StudentProgressProps = {
    percent: number;
    children?: React.ReactNode;
};

const StudentProgress = ({ percent, children }: StudentProgressProps) => {
    const progressBarStyles: CSSProperties = {
        border: "1px solid #aaaaaa",
        height: "24px",
        "--bs-progress-bar-bg": "rgba(202, 190, 225, 1)",
    } as CSSProperties;
    return (
        <div className="position-relative">
            <ProgressBar style={progressBarStyles} now={percent} />
            {children}
        </div>
    );
};

export default StudentProgress;
