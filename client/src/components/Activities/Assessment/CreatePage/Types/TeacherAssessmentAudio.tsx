import React, { useEffect, useState } from "react";
import { TTeacherAssessmentAudio } from "models/Activity/Items/TAssessmentItems";
import { TeacherAssessmentTypeProps } from "./TeacherAssessmentTypeBase";
import { LoadStatus } from "libs/Status";
import { AudioState } from "models/Audio";
import InputAudio from "components/Form/InputAudio";

const TeacherAssessmentAudio = ({
    data,
    taskUUID,
    onChangeTask,
}: TeacherAssessmentTypeProps<TTeacherAssessmentAudio>) => {
    const [audio, setAudio] = useState<AudioState>({ loadStatus: LoadStatus.NONE });

    useEffect(() => {
        if (audio.loadStatus === LoadStatus.DONE) {
            onChangeTask({ ...data, url: audio.url });
        } else {
            onChangeTask({ ...data, url: "" });
        }
    }, [audio.loadStatus]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <InputAudio htmlId={taskUUID} placeholder="Аудио" className="mt-2" value={audio} onChangeHandler={setAudio} />
    );
};

export default TeacherAssessmentAudio;
