import React from "react";

import { ActivityDoneTry } from "models/Activity/Try/ActivityDoneTry";

interface StudentDoneTryPreviewProps {
    doneTry: ActivityDoneTry;
    name: string;
}

const StudentDoneTryPreview = ({ doneTry, name }: StudentDoneTryPreviewProps) => {
    return (
        <div className="mb-4">
            <div>Начало: {doneTry.end_datetime}</div>
            <div>Окончание: {doneTry.end_datetime}</div>
            <div>{doneTry.is_checked ? "Проверено" : "Не проверено"}</div>
            <div>Ошибок: {doneTry.mistakes_count}</div>
        </div>
    );
};

export default StudentDoneTryPreview;
