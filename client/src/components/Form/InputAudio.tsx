import React, { useEffect } from "react";

import Loading from "components/Common/Loading";
import { LoadStatus } from "libs/Status";
import { AudioState } from "models/Audio";

import { InputBaseProps } from "./InputBase";
import InputError from "./InputError";
import styles from "./Styles.module.css";

export interface InputAudioProps extends InputBaseProps {
    value: AudioState;
    onChangeHandler: (value: AudioState) => void;
    customValidation?: () => void;
}

interface InputAudioLabelProps extends InputBaseProps {
    value: AudioState;
}

const InputAudioLabel = ({ htmlId, value }: InputAudioLabelProps) => {
    const hasValue =
        value.loadStatus === LoadStatus.DONE ||
        ((value.loadStatus === LoadStatus.ERROR || value.loadStatus === LoadStatus.LOADING) && value.url !== undefined);
    const isLoading = value.loadStatus === LoadStatus.LOADING;

    const borderClassName =
        value.loadStatus === LoadStatus.ERROR ? styles.inputFileBorderError : styles.inputFileBorderDefault;

    if (hasValue) {
        return (
            <div className="d-flex align-items-center gap-2 justify-content-center px-5">
                <div className={styles.inputFilePrevAudio}>
                    <audio controls key={value.url}>
                        <source src={value.url} type="audio/mpeg" />
                        Your browser does not support the audio.
                    </audio>
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

type AudioResponse = { filename: string };
type AudioError = { message?: string };

const InputAudio = ({
    htmlId,
    placeholder,
    value,
    errorMessage,
    className,
    onChangeHandler,
    customValidation,
}: InputAudioProps) => {
    className = className ?? "";
    const errorHandler = (error: AudioError) => {
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
            fetch("/api/upload/audio", {
                method: "POST",
                body: data,
            })
                .then((response) => {
                    const promise = response.json();
                    if (response.ok) {
                        promise.then((body: AudioResponse) => {
                            onChangeHandler({ loadStatus: LoadStatus.DONE, url: body.filename });
                        });
                    } else {
                        promise
                            .then((body: AudioError) => {
                                const error: AudioError = { message: body.message };
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

    const audioId = `${htmlId}_audio`;

    return (
        <div className={`${styles.inputFile} ${className}`}>
            <InputAudioLabel value={value} placeholder={placeholder} htmlId={audioId} />
            <InputError {...getErrorMessage()} className="justify-content-center" />
            <input className="d-none" type="file" id={audioId} accept=".mp3,audio/*" onChange={handler} />
        </div>
    );
};

export default InputAudio;
