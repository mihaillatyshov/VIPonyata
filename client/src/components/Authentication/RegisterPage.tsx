import React, { useEffect, useState } from "react";

import InputDate from "components/Form/InputDate";
import InputError from "components/Form/InputError";
import InputText from "components/Form/InputText";
import { useFormState } from "components/Form/useFormState";
import { AjaxPost } from "libs/ServerAPI";
import { LoadStatus } from "libs/Status";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch } from "redux/hooks";
import { setUserData, UserDataType } from "redux/slices/userSlice";
import { ValidateEmpty } from "validators/FormValidators";

export interface RegisterForm {
    nickname: string;
    password1: string;
    password2: string;
    name: string;
    birthday: string;
}

const defaultForm: RegisterForm = {
    nickname: "",
    password1: "",
    password2: "",
    name: "",
    birthday: "",
};

const RegisterPage = () => {
    const [serverError, setServerError] = useState<string>("");

    const dispatch = useAppDispatch();

    const navigate = useNavigate();

    const { inputs, validateForm, inputProps } = useFormState<RegisterForm>(
        { ...defaultForm },
        {},
        {
            nickname: ValidateEmpty,
            password1: ValidateEmpty,
            password2: ValidateEmpty,
            name: ValidateEmpty,
            birthday: ValidateEmpty,
        },
    );

    useEffect(() => {
        if (serverError !== "") {
            setServerError("");
        }
    }, [inputs.nickname, inputs.password1, inputs.password2, inputs.name, inputs.birthday]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!validateForm()) {
            return;
        }

        AjaxPost<UserDataType>({
            url: "/api/register",
            body: { ...inputs },
        })
            .then((json) => {
                dispatch(setUserData({ loadStatus: LoadStatus.DONE, ...json }));
                navigate("/");
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
            <InputText placeholder="Имя" htmlId="register-name" className="mt-2" {...inputProps.name} />
            <InputText placeholder="Никнейм" htmlId="register-nickname" className="mt-2" {...inputProps.nickname} />
            <InputText
                placeholder="Пароль"
                type="password"
                htmlId="register-passwd1"
                className="mt-2"
                {...inputProps.password1}
            />
            <InputText
                placeholder="Подтверждение пароля"
                type="password"
                htmlId="register-passwd2"
                className="mt-2"
                {...inputProps.password2}
            />
            <InputDate
                placeholder="День рождения"
                htmlId="register-birthday"
                className="mt-2"
                {...inputProps.birthday}
            />

            <InputError message={serverError} />

            <div className="d-flex justify-content-center">
                <input type="submit" className="btn btn-success mt-2" value={"Зарегистрироваться"} />
            </div>
            <div className="d-flex justify-content-center mt-3">
                <Link to="/" className="auth-alter-link">
                    Вход
                </Link>
            </div>
        </form>
    );
};

export default RegisterPage;
