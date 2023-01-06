import React from "react";

type DAHBoubleProps = {
    title: string;
    children: React.ReactNode;
};

const DAHBouble = ({ title, children }: DAHBoubleProps) => {
    return (
        <div className="wrapperDAH">
            <div className="textDAH">
                <div>
                    <div> {title} </div>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default DAHBouble;
