import Loading from "components/Common/Loading";
import React from "react";
import ActivityBouble from "./ActivityBouble";

interface LoadingBoubleProps {
    title: string;
}

const LoadingBouble = ({ title }: LoadingBoubleProps) => {
    return (
        <ActivityBouble title={title}>
            <div className="placeholder-wave">
                <span className="placeholder bg-secondary me-3 rounded" style={{ width: "80px" }}></span>
                <span className="placeholder bg-secondary me-3 rounded" style={{ width: "40px" }}></span>
                <span className="placeholder bg-secondary me-3 rounded" style={{ width: "60px" }}></span>
                <span className="placeholder bg-secondary me-3 rounded" style={{ width: "80px" }}></span>
                <span className="placeholder bg-secondary me-3 rounded" style={{ width: "60px" }}></span>
                <span className="placeholder bg-secondary me-3 rounded" style={{ width: "60px" }}></span>
            </div>
        </ActivityBouble>
    );
};

export default LoadingBouble;
