import React from "react";

import { IActivityDoneTry } from "models/Activity/Try/IActivityTry";

interface StudentDoneTryPreviewProps {
    doneTry: IActivityDoneTry;
    openTryPage: (id: number) => void;
}

const StudentDoneTryPreview = ({ doneTry, openTryPage }: StudentDoneTryPreviewProps) => {
    return (
        <div className="done-try-preview" onClick={() => openTryPage(doneTry.id)}>
            <div>Начало: {doneTry.start_datetime}</div>
            <div>Окончание: {doneTry.end_datetime}</div>
            <div>{doneTry.is_checked ? "Проверено" : "Не проверено"}</div>
            <div>Ошибок: {doneTry.mistakes_count}</div>
        </div>
    );
};

export default StudentDoneTryPreview;