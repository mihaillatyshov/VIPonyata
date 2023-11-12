import React from "react";

import Loading from "components/Common/Loading";
import { LoadStatus } from "libs/Status";
import { GetActivityDoneTriesDataType } from "requests/Activity/Activity";

import StudentDoneTryPreview from "./StudentDoneTryPreview";

interface StudentViewDoneTryModalContentProps {
    doneTries: GetActivityDoneTriesDataType;
    openTryPage: (id: number) => void;
    errorMessage: string;
}

const StudentViewDoneTryModalContent = ({
    doneTries,
    openTryPage,
    errorMessage,
}: StudentViewDoneTryModalContentProps) => {
    if (doneTries.loadStatus === LoadStatus.ERROR) {
        return <h2 className="text-center">{errorMessage}</h2>;
    }

    if (doneTries.loadStatus !== LoadStatus.DONE) {
        return (
            <div className="d-flex justify-content-center align-items-center">
                <Loading size="xxl" />
            </div>
        );
    }

    return (
        <div>
            {doneTries.data.map((doneTry) => (
                <StudentDoneTryPreview key={doneTry.id} doneTry={doneTry} openTryPage={openTryPage} />
            ))}
        </div>
    );
};

export default StudentViewDoneTryModalContent;
