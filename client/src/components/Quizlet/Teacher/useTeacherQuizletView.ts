import { useLocation } from "react-router-dom";

export type TeacherQuizletView =
    | { kind: "lessons" }
    | { kind: "lesson"; lessonId: number }
    | { kind: "topic"; topicId: number }
    | { kind: "assignments-create" }
    | { kind: "assignments-list" }
    | { kind: "students-dictionaries"; studentId?: number; topicId?: number };

export const teacherQuizletPaths = {
    lessons: "/quizlet",
    lesson: (lessonId: number) => `/quizlet/lessons/${lessonId}`,
    topic: (topicId: number) => `/quizlet/topics/${topicId}`,
    assignmentsCreate: "/quizlet/assignments",
    assignmentsList: "/quizlet/assignments/list",
    studentsDictionaries: "/quizlet/students-dictionaries",
    studentDictionary: (studentId: number) => `/quizlet/students-dictionaries/${studentId}`,
    studentTopic: (studentId: number, topicId: number) =>
        `/quizlet/students-dictionaries/${studentId}/topics/${topicId}`,
};

const parseTeacherQuizletView = (pathname: string): TeacherQuizletView => {
    if (pathname === teacherQuizletPaths.assignmentsCreate) {
        return { kind: "assignments-create" };
    }

    if (pathname === teacherQuizletPaths.assignmentsList) {
        return { kind: "assignments-list" };
    }

    const studentsMatch = pathname.match(/^\/quizlet\/students-dictionaries(?:\/(\d+)(?:\/topics\/(\d+))?)?$/);
    if (studentsMatch !== null) {
        return {
            kind: "students-dictionaries",
            studentId: studentsMatch[1] ? Number(studentsMatch[1]) : undefined,
            topicId: studentsMatch[2] ? Number(studentsMatch[2]) : undefined,
        };
    }

    const lessonMatch = pathname.match(/^\/quizlet\/lessons\/(\d+)$/);
    if (lessonMatch !== null) {
        return { kind: "lesson", lessonId: Number(lessonMatch[1]) };
    }

    const topicMatch = pathname.match(/^\/quizlet\/topics\/(\d+)$/);
    if (topicMatch !== null) {
        return { kind: "topic", topicId: Number(topicMatch[1]) };
    }

    return { kind: "lessons" };
};

export const useTeacherQuizletView = (): TeacherQuizletView => parseTeacherQuizletView(useLocation().pathname);
