import React, { useLayoutEffect, useState } from "react";

import Loading from "components/Common/Loading";
import { AjaxGet } from "libs/ServerAPI";
import { Link } from "react-router-dom";
import { useUserIsTeacher } from "redux/funcs/user";

interface CounterProps {
    count: number | undefined;
}

const Counter = ({ count }: CounterProps) => {
    if (count === undefined) {
        return (
            <div className="font-icon-height-0 mt-1 mb-2">
                <Loading size={28} />
            </div>
        );
    }

    return (
        <div className="font-icon-height-0 mt-3 mb-4" style={{ fontSize: "22px" }}>
            {count}
        </div>
    );
};

const StudentDictionary = () => {
    const [count, setCount] = useState<number | undefined>(undefined);
    const isTeacher = useUserIsTeacher();

    const getCount = () => {
        AjaxGet<{ count: number }>({ url: "/api/dictionary/count" }).then((json) => {
            setCount(json.count);
            console.log(json.count);
        });
    };

    useLayoutEffect(() => {
        getCount();
        let timerId = setInterval(getCount, 30_000);

        return () => clearInterval(timerId);
    }, []);

    return (
        <div className="d-flex mx-auto flex-column align-items-center">
            <Link className="a-clear navbar-dictionary-title" to="/dictionary">
                じしょ
            </Link>
            {isTeacher ? null : <Counter count={count} />}
        </div>
    );
};

export default StudentDictionary;
