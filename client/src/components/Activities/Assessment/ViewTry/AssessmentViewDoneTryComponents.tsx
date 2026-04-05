interface TaskMistakesProps {
    cheked: boolean;
    mistakes_count: number;
}

export const TaskMistakes = ({ cheked, mistakes_count }: TaskMistakesProps) => {
    if (!cheked) {
        return <div className="student-assessment-task__title-not-checked fst-italic">Не проверено</div>;
    }

    if (mistakes_count > 0) {
        return <div className="fst-italic">Ошибок: {mistakes_count}</div>;
    }

    return <div className="fst-italic">Ошибок нет</div>;
};
