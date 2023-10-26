import React, { useCallback, useEffect, useRef, useState } from "react";

import CSS from "csstype";
import { LoadStatus } from "libs/Status";
import { getMinutes, getSeconds, getVV } from "libs/useTimer";

import styles from "./StyleAudio.module.css";

const ICON_SIZE = "32px";

interface AudioPlayerProps {
    url: string;
}

interface AudioData {
    duration: number;
    currentTime: number;
}

function AudioPlayer({ url }: AudioPlayerProps) {
    const [audioElement] = useState<HTMLAudioElement>(() => new Audio(url));
    const isPausedBefore = useRef<boolean>(false);
    const [audioData, setAudioData] = useState<LoadStatus.DataDoneOrNotDone<AudioData>>(() => ({
        loadStatus: LoadStatus.LOADING,
    }));

    const updateCurrentTime = () => {
        if (audioData.loadStatus !== LoadStatus.DONE) return;
        if (audioElement.currentTime === audioData.currentTime) return;

        setAudioData({
            ...audioData,
            currentTime: audioElement.currentTime,
        });
    };

    const onLoadedDataCallback = useCallback(() => {
        setAudioData(() => ({
            loadStatus: LoadStatus.DONE,
            duration: audioElement.duration,
            currentTime: audioElement.currentTime,
        }));
    }, []);

    useEffect(() => {
        audioElement.addEventListener("loadeddata", onLoadedDataCallback);
        return () => {
            audioElement.pause();
            audioElement.removeEventListener("loadeddata", onLoadedDataCallback);
        };
    }, []);

    useEffect(() => {
        const interval = setInterval(updateCurrentTime, 25);

        return () => clearInterval(interval);
    }, [audioData, updateCurrentTime]);

    if (audioData.loadStatus !== LoadStatus.DONE) {
        console.log("testLoading");

        return <div>loading</div>;
    }

    console.log(audioData.currentTime);

    const play = () => audioElement.paused && audioElement.play();
    const pause = () => !audioElement.paused && audioElement.pause();
    const reset = () => (audioElement.currentTime = 0);

    const onChangeCurrentTimeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
        audioElement.currentTime = e.target.valueAsNumber;
    };

    const onProgressMouseDownHandler = () => {
        console.log("mouse down");
        isPausedBefore.current = audioElement.paused;
        audioElement.pause();
    };

    const onProgressMouseUpHandler = () => {
        console.log("mouse up");
        if (!isPausedBefore.current) {
            audioElement.play();
        }
    };

    const getDurationStr = () => {
        const duration = audioData.duration * 1000;
        return getVV(getMinutes(duration)) + ":" + getVV(getSeconds(duration));
    };

    const getCurrentTimeStr = () => {
        const currentTime = audioData.currentTime * 1000;
        return getVV(getMinutes(currentTime)) + ":" + getVV(getSeconds(currentTime));
    };

    const style = { "--range-progress": `${(audioData.currentTime / audioData.duration) * 100}%` } as CSS.Properties;

    return (
        <div>
            <div className="d-flex align-items-center">
                <div className="me-3">{getCurrentTimeStr()}</div>
                <input
                    className={styles.progressBar}
                    type="range"
                    style={{ ...style }}
                    min={0}
                    max={audioData.duration}
                    step={0.0001}
                    value={audioData.currentTime}
                    onChange={onChangeCurrentTimeHandler}
                    onMouseDown={onProgressMouseDownHandler}
                    onMouseUp={onProgressMouseUpHandler}
                />
                <div className="ms-3">{getDurationStr()}</div>
            </div>
            <div className="d-flex align-items-center">
                <div onClick={reset}>
                    <i className="bi bi-skip-start-fill" style={{ fontSize: ICON_SIZE }} />
                </div>
                {audioElement.paused ? (
                    <div onClick={play}>
                        <i className="bi bi-play-fill" style={{ fontSize: ICON_SIZE }} />
                    </div>
                ) : (
                    <div onClick={pause}>
                        <i className="bi bi-pause-fill" style={{ fontSize: ICON_SIZE }} />
                    </div>
                )}
            </div>
        </div>
    );
}

export default AudioPlayer;
