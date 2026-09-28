import { useNavigate } from "react-router-dom";

import { TQuizletStudentCard } from "api/quizlet";

import { teacherQuizletPaths } from "./useTeacherQuizletView";

interface StudentCardProps {
    student: TQuizletStudentCard;
    onToggleHidden: (student: TQuizletStudentCard) => void;
}

const StudentCard = ({ student, onToggleHidden }: StudentCardProps) => {
    const navigate = useNavigate();
    const open = () => navigate(teacherQuizletPaths.studentDictionary(student.id));

    return (
        <div className="col">
            <div className={`card quizlet-topic-card h-100${student.is_hidden ? " border-secondary-subtle" : ""}`}>
                <div className="card-body d-flex flex-column justify-content-between gap-3">
                    <div className="d-flex align-items-start justify-content-between gap-2">
                        <button
                            className="btn flex-grow-1 text-start p-0 border-0 quizlet-topic-card-btn"
                            onClick={open}
                        >
                            <span
                                className={`quizlet-topic-card__title fw-semibold${student.is_hidden ? " text-muted" : ""}`}
                            >
                                {student.nickname}
                            </span>
                        </button>
                        <button
                            className={`btn btn-sm btn-link p-0 border-0 flex-shrink-0 ${
                                student.is_hidden ? "text-primary" : "text-secondary"
                            }`}
                            onClick={() => onToggleHidden(student)}
                            title={student.is_hidden ? "Показать ученика" : "Скрыть ученика"}
                            aria-label={`${student.is_hidden ? "Показать" : "Скрыть"} ученика ${student.nickname}`}
                        >
                            <i className={`bi ${student.is_hidden ? "bi-eye" : "bi-eye-slash"}`} />
                        </button>
                    </div>
                    <button className="btn w-100 text-start p-0 border-0 quizlet-topic-card-btn" onClick={open}>
                        <span className="quizlet-topic-card__count text-muted mt-2">{student.name}</span>
                        {!student.is_hidden && !student.has_personal_dictionary && (
                            <span className="small text-warning mt-2">Словарь еще не создан</span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

interface StudentsDictionaryListProps {
    students: TQuizletStudentCard[];
    onToggleHidden: (student: TQuizletStudentCard) => void;
}

const StudentsDictionaryList = ({ students, onToggleHidden }: StudentsDictionaryListProps) => {
    const visibleStudents = students.filter((student) => !student.is_hidden);
    const hiddenStudents = students.filter((student) => student.is_hidden);

    return (
        <>
            <h5 className="mb-3">Словари учеников</h5>
            {students.length === 0 && <div className="text-muted">Пока нет учеников</div>}
            {visibleStudents.length > 0 && (
                <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-2 pt-1">
                    {visibleStudents.map((student) => (
                        <StudentCard key={student.id} student={student} onToggleHidden={onToggleHidden} />
                    ))}
                </div>
            )}
            {visibleStudents.length === 0 && students.length > 0 && (
                <div className="text-muted">Все ученики сейчас скрыты</div>
            )}
            {hiddenStudents.length > 0 && (
                <div className="mt-4">
                    <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
                        <h6 className="mb-0 text-muted">Скрытые ученики</h6>
                        <span className="small text-muted">Не попадают в выдачу assignment</span>
                    </div>
                    <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-2 pt-1">
                        {hiddenStudents.map((student) => (
                            <StudentCard key={student.id} student={student} onToggleHidden={onToggleHidden} />
                        ))}
                    </div>
                </div>
            )}
        </>
    );
};

export default StudentsDictionaryList;
