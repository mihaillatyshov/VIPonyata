import React from "react";

type ActivityBubbleProps = {
    title: string;
    children: React.ReactNode;
    bubbleClassName?: string;
};

const ActivityBubble = ({ title, children, bubbleClassName }: ActivityBubbleProps) => {
    return (
        <div className="wrapperActivity">
            <div className="textActivity">
                <div className={`box-shadow-main rounded-circle ${bubbleClassName || ""}`}>
                    <div className="bubble__title"> {title} </div>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default ActivityBubble;
