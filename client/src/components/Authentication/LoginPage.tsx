import React, { useEffect, useState } from "react";

import InputError from "components/Form/InputError";
import InputText from "components/Form/InputText";
import { useFormState } from "components/Form/useFormState";
import { AjaxPost } from "libs/ServerAPI";
import { LoadStatus } from "libs/Status";
import { Link } from "react-router-dom";
import { useAppDispatch } from "redux/hooks";
import { setUserData, UserDataType } from "redux/slices/userSlice";
import { ValidateEmpty } from "validators/FormValidators";

export interface LoginForm {
    nickname: string;
    password: string;
}

const defaultForm: LoginForm = {
    nickname: "",
    password: "",
};

const LoginPage = () => {
    const [serverError, setServerError] = useState<string>("");

    const dispatch = useAppDispatch();

    const { inputs, validateForm, inputProps } = useFormState<LoginForm>(
        { ...defaultForm },
        {},
        {
            nickname: ValidateEmpty,
            password: ValidateEmpty,
        },
    );

    useEffect(() => {
        if (serverError !== "") {
            setServerError("");
        }
    }, [inputs.nickname, inputs.password]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!validateForm()) {
            return;
        }

        AjaxPost<UserDataType>({
            url: "/api/login",
            body: { ...inputs },
        })
            .then((json) => {
                dispatch(setUserData({ loadStatus: LoadStatus.DONE, ...json }));
            })
            .catch(({ isServerError, json, response }) => {
                if (!isServerError) {
                    if (response.status >= 400 && json.message !== undefined && json.message !== null) {
                        setServerError(json.message);
                    }
                }
            });
    };

    return (
        <form className="auth-form" onSubmit={handleSubmit}>
            <InputText placeholder="Никнейм" htmlId="register-nickname" className="mt-2" {...inputProps.nickname} />
            <InputText
                placeholder="Пароль"
                type="password"
                htmlId="register-passwd1"
                className="mt-2"
                {...inputProps.password}
            />

            <InputError message={serverError} />

            <div className="d-flex justify-content-center">
                <input type="submit" className="btn btn-success mt-2" value={"Войти"} />
            </div>

            <div className="d-flex justify-content-center mt-3">
                <Link to="/register" className="auth-alter-link">
                    Регистрация
                </Link>
            </div>
        </form>
    );
};

export default LoginPage;
