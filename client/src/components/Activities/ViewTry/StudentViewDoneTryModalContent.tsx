import React from "react";

import { LoadStatus } from "libs/Status";
import { GetActivityDoneTriesDataType } from "requests/Activity/Activity";

import StudentDoneTryPreview from "./StudentDoneTryPreview";

interface StudentViewDoneTryModalContentProps {
    doneTries: GetActivityDoneTriesDataType;
    name: string;
    errorMessage: string;
}

const StudentViewDoneTryModalContent = ({ doneTries, name, errorMessage }: StudentViewDoneTryModalContentProps) => {
    if (doneTries.loadStatus === LoadStatus.ERROR) {
        return <h2 className="text-center">{errorMessage}</h2>;
    }

    if (doneTries.loadStatus !== LoadStatus.DONE) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            {doneTries.data.map((doneTry) => (
                <StudentDoneTryPreview key={doneTry.id} doneTry={doneTry} name={name} />
            ))}
        </div>
    );
};

export default StudentViewDoneTryModalContent;
