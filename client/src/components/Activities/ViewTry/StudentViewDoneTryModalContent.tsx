import Loading from "components/Common/Loading";
import { LoadStatus } from "libs/Status";
import { GetActivityDoneTriesDataType } from "requests/Activity/Activity";

import StudentDoneTryPreview from "./StudentDoneTryPreview";

interface StudentViewDoneTryModalContentProps {
    doneTries: GetActivityDoneTriesDataType;
    openTryPage: (id: number) => void;
    errorMessage: string;
    isAssessmentStyle?: boolean;
}

const StudentViewDoneTryModalContent = ({
    doneTries,
    openTryPage,
    errorMessage,
    isAssessmentStyle = false,
}: StudentViewDoneTryModalContentProps) => {
    if (doneTries.loadStatus === LoadStatus.ERROR) {
        return (
            <h2 className="text-center">
                <img src="/img/cat.jpg" alt="WIP" style={{ maxHeight: "400px", maxWidth: "100%" }} />
                <div>Я Машин программист</div>
                <div>У меня лапки</div>
                <div>"Скоро" все будет</div>
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
        <div className={isAssessmentStyle ? "d-flex flex-column gap-2" : "view-done-try"}>
            {doneTries.data.map((doneTry) => (
                <StudentDoneTryPreview
                    key={doneTry.id}
                    doneTry={doneTry}
                    openTryPage={openTryPage}
                    isAssessmentStyle={isAssessmentStyle}
                />
            ))}
        </div>
    );
};

export default StudentViewDoneTryModalContent;
