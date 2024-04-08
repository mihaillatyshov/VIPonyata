import React from "react";

type ActivityBoubleProps = {
    title: string;
    children: React.ReactNode;
};

const ActivityBouble = ({ title, children }: ActivityBoubleProps) => {
    return (
        <div className="wrapperActivity">
            <div className="textActivity">
                <div className="box-shadow-main rounded-circle">
                    <div className="bouble__title"> {title} </div>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default ActivityBouble;
