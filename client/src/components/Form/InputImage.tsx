import { LoadStatus } from "libs/Status";
import { ImageState } from "models/Img";
import React, { useEffect } from "react";
import InputError from "./InputError";

import styles from "./Styles.module.css";
import Loading from "components/Common/Loading";
import { InputBaseProps } from "./InputBase";

export interface InputImageProps extends InputBaseProps {
    value: ImageState;
    onChangeHandler: (value: ImageState) => void;
    customValidation?: () => void;
}

interface InputImageLabelProps extends InputBaseProps {
    value: ImageState;
}

const InputImageLabel = ({ htmlId, value, placeholder }: InputImageLabelProps) => {
    const hasValue =
        value.loadStatus === LoadStatus.DONE ||
        ((value.loadStatus === LoadStatus.ERROR || value.loadStatus === LoadStatus.LOADING) && value.url !== undefined);
    const isLoading = value.loadStatus === LoadStatus.LOADING;

    const borderClassName =
        value.loadStatus === LoadStatus.ERROR ? styles.inputImageBorderError : styles.inputImageBorderDefault;

    if (hasValue) {
        return (
            <label htmlFor={htmlId} className={`${styles.inputImagePrev} ${borderClassName}`}>
                <img src={value.url} alt={placeholder} className={styles.inputImagePrevImg} />
                {isLoading ? (
                    <div className={styles.inputImagePrevEdit}>
                        <Loading />
                    </div>
                ) : (
                    <div className={styles.inputImagePrevEdit}>
                        <i className="bi bi-pencil-square" style={{ fontSize: "48px" }} />
                    </div>
                )}
            </label>
        );
    }

    return (
        <label htmlFor={htmlId} className={`${styles.inputImageEmptyLabel} ${borderClassName}`}>
            {isLoading ? <Loading /> : <i className="bi bi-file-earmark-plus" style={{ fontSize: "48px" }} />}
        </label>
    );
};

type ImageResponse = { filename: string };
type ImageError = { message?: string };

const InputImage = ({
    htmlId,
    placeholder,
    value,
    errorMessage,
    className,
    onChangeHandler,
    customValidation,
}: InputImageProps) => {
    className = className ?? "";
    const errorHandler = (error: ImageError) => {
        onChangeHandler({
            loadStatus: LoadStatus.ERROR,
            url: value.loadStatus !== LoadStatus.NONE ? value.url : undefined,
            message: error.message,
        });
    };

    useEffect(() => {
        if (value.loadStatus !== LoadStatus.LOADING) {
            customValidation?.();
        }
    }, [value.loadStatus]); // eslint-disable-line react-hooks/exhaustive-deps

    const handler = (e: React.ChangeEvent<HTMLInputElement>) => {
        console.log(e.target.value, e.target.files);
        if (e.target.files && e.target.files.length > 0) {
            onChangeHandler({
                loadStatus: LoadStatus.LOADING,
                url: value.loadStatus !== LoadStatus.NONE ? value.url : undefined,
            });
            const data = new FormData();
            data.append("file", e.target.files[0]);
            fetch("/api/upload/img", {
                method: "POST",
                body: data,
            })
                .then((response) => {
                    const promise = response.json();
                    if (response.ok) {
                        promise.then((body: ImageResponse) => {
                            onChangeHandler({ loadStatus: LoadStatus.DONE, url: body.filename });
                        });
                    } else {
                        promise
                            .then((body: ImageError) => {
                                const error: ImageError = { message: body.message };
                                throw error;
                            })
                            .catch(errorHandler);
                    }
                })
                .catch(errorHandler);
        }
    };

    const getErrorMessage = () => {
        if (value.loadStatus === LoadStatus.ERROR) {
            return { message: value.message ?? "Нет ответа от сервера", isWarning: true };
        }
        return { message: errorMessage };
    };

    return (
        <div className={`${styles.inputImage} ${className}`}>
            <InputImageLabel value={value} placeholder={placeholder} htmlId={htmlId} />
            <InputError {...getErrorMessage()} className="justify-content-center" />
            <input className="d-none" type="file" id={htmlId} accept="image/*" onChange={handler} />
        </div>
    );
};

export default InputImage;
