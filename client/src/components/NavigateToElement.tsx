import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

type NavigateToElementProps = {
    to: string;
};

const NavigateToElement = ({ to }: NavigateToElementProps) => {
    const navigate = useNavigate();
    useEffect(() => {
        navigate(to);
    });
    return <></>;
};

export default NavigateToElement;
