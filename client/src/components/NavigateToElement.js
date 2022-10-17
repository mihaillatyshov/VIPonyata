import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const NavigateToElement = ({ to }) => {
    const navigate = useNavigate();
    useEffect(() => {
        navigate(to);
    });
    return <></>;
};

export default NavigateToElement;
