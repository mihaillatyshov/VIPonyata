import React from "react";
import { ProgressBar } from "react-bootstrap";

type StudentProgressProps = {
    percent: number;
};

const StudentProgress = ({ percent }: StudentProgressProps) => {
    return <ProgressBar variant="success" now={percent} />;
};

export default StudentProgress;
