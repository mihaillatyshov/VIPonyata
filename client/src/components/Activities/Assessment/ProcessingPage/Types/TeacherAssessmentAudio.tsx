import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";

import { FloatingLabelTextareaAutosize } from "components/Form/FloatingLabelTextareaAutosize";
import InputAudio from "components/Form/InputAudio";
import { LoadStatus } from "libs/Status";
import { TTeacherAssessmentAudio } from "models/Activity/Items/TAssessmentItems";
import { AudioState } from "models/Audio";

import { TeacherAssessmentTypeProps } from "./TeacherAssessmentTypeBase";

const TeacherAssessmentAudio = ({
    data,
    taskUUID,
    onChangeTask,
}: TeacherAssessmentTypeProps<TTeacherAssessmentAudio>) => {
    const [audio, setAudio] = useState<AudioState>(
        data.url === "" ? { loadStatus: LoadStatus.NONE } : { loadStatus: LoadStatus.DONE, url: data.url },
    );

    useEffect(() => {
        setAudio(data.url === "" ? { loadStatus: LoadStatus.NONE } : { loadStatus: LoadStatus.DONE, url: data.url });
    }, [data.url]);

    const setAudioHandler = (imgState: AudioState) => {
        if (imgState.loadStatus === LoadStatus.DONE) {
            onChangeTask({ ...data, url: imgState.url });
        } else {
            setAudio(imgState);
        }
    };

    return (
        <>
            <FloatingLabelTextareaAutosize
                htmlId={`description_${taskUUID}`}
                placeholder="Описание"
                value={data.description || ""}
                onChangeHandler={(newValue: string) => onChangeTask({ ...data, description: newValue })}
                rows={5}
                noErrorField={true}
                autoFocus={true}
            />
            {data.description && (
                <div className="mt-2 text-center md-last-pad-zero">
                    <ReactMarkdown>{data.description}</ReactMarkdown>
                </div>
            )}
            <InputAudio
                htmlId={taskUUID}
                placeholder="Аудио"
                className="mt-2"
                value={audio}
                onChangeHandler={setAudioHandler}
            />
        </>
    );
};

export default TeacherAssessmentAudio;
