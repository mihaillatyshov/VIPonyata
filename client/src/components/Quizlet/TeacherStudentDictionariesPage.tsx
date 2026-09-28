import { quizletKeys, quizletQueries, setQuizletStudentHidden, TQuizletStudentCard } from "api/quizlet";
import Loading from "components/Common/Loading";
import ErrorPage from "components/ErrorPages/ErrorPage";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import StudentDictionaryDetails from "./Teacher/StudentDictionaryDetails";
import StudentsDictionaryList from "./Teacher/StudentsDictionaryList";

interface TeacherStudentDictionariesPageProps {
    selectedStudentId?: number;
    selectedTopicId?: number;
}

const TeacherStudentDictionariesPage = ({
    selectedStudentId,
    selectedTopicId,
}: TeacherStudentDictionariesPageProps) => {
    const queryClient = useQueryClient();
    const studentsQuery = useQuery(quizletQueries.studentsList());
    const dictionaryQuery = useQuery({
        ...quizletQueries.studentDictionary(selectedStudentId ?? 0),
        enabled: selectedStudentId !== undefined,
    });

    const toggleStudentHidden = async (student: TQuizletStudentCard) => {
        await setQuizletStudentHidden(student.id, !student.is_hidden);
        await queryClient.invalidateQueries({ queryKey: quizletKeys.studentsList() });
    };

    if (studentsQuery.isError || (selectedStudentId !== undefined && dictionaryQuery.isError)) {
        return (
            <ErrorPage
                errorImg="/svg/SomethingWrong.svg"
                textMain="Не удалось загрузить словари учеников"
                textDisabled="Попробуйте перезагрузить страницу"
            />
        );
    }

    if (studentsQuery.isPending || (selectedStudentId !== undefined && dictionaryQuery.isPending)) {
        return <Loading />;
    }

    const students = studentsQuery.data.students;

    return (
        <div className="quizlet-main-container">
            {selectedStudentId === undefined || dictionaryQuery.data === undefined ? (
                <StudentsDictionaryList students={students} onToggleHidden={toggleStudentHidden} />
            ) : (
                <StudentDictionaryDetails
                    key={selectedStudentId}
                    studentId={selectedStudentId}
                    student={students.find((student) => student.id === selectedStudentId) ?? null}
                    dictionary={dictionaryQuery.data}
                    topicId={selectedTopicId}
                    onToggleHidden={toggleStudentHidden}
                />
            )}
        </div>
    );
};

export default TeacherStudentDictionariesPage;
