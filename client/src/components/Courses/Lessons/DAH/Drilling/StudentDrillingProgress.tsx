import React from "react";
import { ProgressBar } from "react-bootstrap";

type StudentDrillingProgressProps = {
    percent: number;
};

const StudentDrillingProgress = ({ percent }: StudentDrillingProgressProps) => {
    return <ProgressBar variant="success" now={percent} />;
};

export default StudentDrillingProgress;
