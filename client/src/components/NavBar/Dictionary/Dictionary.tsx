import React, { useLayoutEffect, useState } from "react";
import { Link } from "react-router-dom";

import Loading from "components/Common/Loading";
import { AjaxGet } from "libs/ServerAPI";
import { useUserIsTeacher } from "redux/funcs/user";

interface CounterProps {
    count: number | undefined;
}

const Counter = ({ count }: CounterProps) => {
    if (count === undefined) {
        return (
            <span className="font-icon-height-0 mt-1 mb-2">
                <Loading size={50} />
            </span>
        );
    }

    return <span>{count}</span>;
};

export const Dictionary = () => {
    const [count, setCount] = useState<number | undefined>(undefined);
    const isTeacher = useUserIsTeacher();

    const getCount = () => {
        if (isTeacher) return;

        AjaxGet<{ count: number }>({ url: "/api/dictionary/count" }).then((json) => {
            setCount(json.count);
        });
    };

    useLayoutEffect(() => {
        getCount();
        let timerId = setInterval(getCount, 30_000);

        return () => clearInterval(timerId);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="d-flex mx-auto align-items-center">
            <Link className="d-flex a-clear navbar-dictionary-title ap-japanesefont" to="/dictionary">
                じしょ{!isTeacher && ":"} {!isTeacher && <Counter count={count} />}
            </Link>
        </div>
    );
};

