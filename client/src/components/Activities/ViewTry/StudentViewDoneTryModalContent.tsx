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
        return (
            <h2 className="text-center">
                <img src="/img/cat.jpg" alt="WIP" style={{ maxHeight: "400px", maxWidth: "100%" }} />
                <div>Я Машин программист</div>
                <div>У меня лапки</div>
                <div>Скоро все будет</div>
                {/* <div>{errorMessage}</div> */}
            </h2>
        );
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
