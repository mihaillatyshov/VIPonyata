import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

type NavigateToElementProps = {
    to: string;
    replace?: boolean;
};

const NavigateToElement = ({ to, replace = false }: NavigateToElementProps) => {
    console.log("replace", replace);
    const navigate = useNavigate();
    useEffect(() => {
        navigate(to, { replace });
    });
    return <></>;
};

export default NavigateToElement;
