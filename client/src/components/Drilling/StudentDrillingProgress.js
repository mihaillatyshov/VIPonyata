import React from "react";

const StudentDrillingProgress = ({ percent }) => {
    return (
        <div className="progress">
            <div
                className="progress-bar bg-success"
                role="progressbar"
                style={{ width: `${percent}%` }}
                aria-valuenow={percent}
                aria-valuemin="0"
                aria-valuemax="100"
            ></div>
        </div>
    );
};

export default StudentDrillingProgress;
