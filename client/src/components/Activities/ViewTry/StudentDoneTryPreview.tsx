import React from "react";

import { IActivityDoneTry } from "models/Activity/Try/IActivityTry";

interface StudentDoneTryPreviewProps {
    doneTry: IActivityDoneTry;
    openTryPage: (id: number) => void;
    isAssessmentStyle?: boolean;
}

const StudentDoneTryPreview = ({ doneTry, openTryPage, isAssessmentStyle = false }: StudentDoneTryPreviewProps) => {
    if (isAssessmentStyle) {
        const [startDate = "-", startTime = "-"] = (doneTry.start_datetime || "").split(" ");
        const [endDate = "-", endTime = "-"] = (doneTry.end_datetime || "").split(" ");

        const handleOpen = () => openTryPage(doneTry.id);

        const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (event) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                handleOpen();
            }
        };

        return (
            <div
                className="notification__item notification__item--compact clickable done-try-preview--centered"
                onClick={handleOpen}
                onKeyDown={handleKeyDown}
                role="button"
                tabIndex={0}
            >
                <div className="notification__item-chip">
                    <i className="bi bi-calendar3" aria-hidden="true"></i>
                    <span>{startDate}</span>
                </div>
                <div className="notification__item-chip">
                    <i className="bi bi-clock" aria-hidden="true"></i>
                    <span>{startTime}</span>
                </div>
                <div className="notification__item-chip">
                    <i className="bi bi-stopwatch" aria-hidden="true"></i>
                    <span>{endDate === "-" ? "-" : `${endDate} ${endTime}`}</span>
                </div>
                <div className="notification__item-chip" title="Количество ошибок">
                    <i className="bi bi-exclamation-circle" aria-hidden="true"></i>
                    <span>Ошибки: {doneTry.mistakes_count}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="done-try-preview done-try-preview--centered">
            <div className="done-try-preview__description">
                <div>
                    <span className="text-nowrap">{doneTry.start_datetime}</span> -{" "}
                    <span className="text-nowrap">{doneTry.end_datetime}</span>
                </div>
                <div>Ошибки: {doneTry.mistakes_count}</div>
            </div>
            <div className="done-try-preview__button-block">
                <input
                    type="button"
                    className="btn btn-violet done-try-preview__button"
                    value="Посмотреть результаты"
                    onClick={() => openTryPage(doneTry.id)}
                />
            </div>
        </div>
    );
};

export default StudentDoneTryPreview;
