import React, { useEffect } from "react";

import Loading from "components/Common/Loading";
import { LoadStatus } from "libs/Status";
import { ImageState } from "models/Img";

import { InputBaseProps } from "./InputBase";
import InputError from "./InputError";
import styles from "./Styles.module.css";

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
        value.loadStatus === LoadStatus.ERROR ? styles.inputFileBorderError : styles.inputFileBorderDefault;

    if (hasValue) {
        return (
            <div className="d-flex align-items-center gap-2 justify-content-center px-5">
                <div className={`${styles.inputFilePrev} ${borderClassName}`} style={{ flex: 1 }}>
                    <img src={value.url} alt={placeholder} className={styles.inputFilePrevImg} />
                </div>
                <label
                    htmlFor={htmlId}
                    className="btn btn-outline-secondary flex-shrink-0"
                    style={{ cursor: "pointer" }}
                >
                    {isLoading ? <Loading /> : <i className="bi bi-plus-lg" style={{ fontSize: "1.2em" }} />}
                </label>
            </div>
        );
    }

    return (
        <label htmlFor={htmlId} className={`${styles.inputFileEmptyLabel} ${borderClassName}`}>
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
        e.preventDefault();
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

    const imgId = `${htmlId}_img`;

    return (
        <div className={`${styles.inputFile} ${className}`}>
            <InputImageLabel value={value} placeholder={placeholder} htmlId={imgId} />
            <InputError {...getErrorMessage()} className="justify-content-center" />
            <input className="d-none" type="file" id={imgId} accept="image/*" onChange={handler} />
        </div>
    );
};

export default InputImage;
