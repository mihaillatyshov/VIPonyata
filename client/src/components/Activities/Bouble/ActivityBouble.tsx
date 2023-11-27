import React from "react";

type ActivityBoubleProps = {
    title: string;
    children: React.ReactNode;
};

const ActivityBouble = ({ title, children }: ActivityBoubleProps) => {
    return (
        <div className="wrapperActivity mb-4">
            <div className="textActivity">
                <div className="box-shadow-main rounded-circle">
                    <div className="pt-5"> {title} </div>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default ActivityBouble;
