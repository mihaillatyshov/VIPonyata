import React from "react";

import { IActivityDoneTry } from "models/Activity/Try/IActivityTry";

interface StudentDoneTryPreviewProps {
    doneTry: IActivityDoneTry;
    openTryPage: (id: number) => void;
}

const StudentDoneTryPreview = ({ doneTry, openTryPage }: StudentDoneTryPreviewProps) => {
    return (
        <div className="done-try-preview">
            <div className="done-try-preview__description">
                <div>
                    <span className="text-nowrap">{doneTry.start_datetime}</span> -{" "}
                    <span className="text-nowrap">{doneTry.end_datetime}</span>
                </div>
                <div>
                    {doneTry.is_checked ? "Проверено" : "Не проверено"} &nbsp;&nbsp;&nbsp;&nbsp; Ошибок:{" "}
                    {doneTry.mistakes_count}
                </div>
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
