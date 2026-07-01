import { Route, Routes } from "react-router-dom";

import PageTitle from "components/Common/PageTitle";

import HomeworkResultPage from "./HomeworkResultPage";
import StudentHomeworkAssignmentPage from "./StudentHomeworkAssignmentPage";

const StudentTasksPage = () => {
    return (
        <Routes>
            <Route path="assignments/:assignmentId" element={<StudentHomeworkAssignmentPage />} />
            <Route path="tries/:tryId" element={<HomeworkResultPage />} />
            <Route
                path="*"
                element={
                    <div className="container pb-5" style={{ maxWidth: "860px" }}>
                        <PageTitle title="タスク" urlBack="/" />
                        <div className="alert alert-info mt-3">Откройте задание с главной страницы.</div>
                    </div>
                }
            />
        </Routes>
    );
};

export default StudentTasksPage;
