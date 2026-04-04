import React from "react";

type ActivityBoubleProps = {
    title: string;
    children: React.ReactNode;
    bubbleClassName?: string;
};

const ActivityBouble = ({ title, children, bubbleClassName }: ActivityBoubleProps) => {
    return (
        <div className="wrapperActivity">
            <div className="textActivity">
                <div className={`box-shadow-main rounded-circle ${bubbleClassName || ""}`}>
                    <div className="bouble__title"> {title} </div>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default ActivityBouble;
