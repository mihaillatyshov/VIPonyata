import React, { useEffect } from 'react';

import { useNavigate } from 'react-router-dom';

import Loading from './Common/Loading';

const NavigateHome = () => {
    const navigate = useNavigate();
    useEffect(() => {
        navigate("/");
    });
    return <Loading />;
};

export default NavigateHome;
