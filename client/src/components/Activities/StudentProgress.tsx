import React from "react";

import { ProgressBar } from "react-bootstrap";

type StudentProgressProps = {
    percent: number;
    children?: React.ReactNode;
};

const StudentProgress = ({ percent, children }: StudentProgressProps) => {
    return (
        <div className="position-relative">
            <ProgressBar style={{ border: "1px solid #aaaaaa", height: "24px" }} variant="success" now={percent} />
            {children}
        </div>
    );
};

export default StudentProgress;
