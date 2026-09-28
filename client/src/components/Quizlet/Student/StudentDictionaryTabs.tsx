import { useNavigate } from "react-router-dom";

import { studentQuizletPaths } from "./studentQuizletRoutes";

/** Переключатель «Словари сэнсэя» / «Мой словарь». */
const StudentDictionaryTabs = ({ active }: { active: "teacher" | "personal" }) => {
    const navigate = useNavigate();

    const tabs = [
        { key: "teacher", label: "Словари сэнсэя", path: studentQuizletPaths.view },
        { key: "personal", label: "Мой словарь", path: studentQuizletPaths.personalDictionary },
    ] as const;

    return (
        <div className="quizlet-student-dictionary-tabs" role="tablist" aria-label="Переключение словарей">
            {tabs.map((tab) => (
                <button
                    key={tab.key}
                    type="button"
                    role="tab"
                    aria-selected={active === tab.key}
                    className={`btn quizlet-student-dictionary-tab${active === tab.key ? " active" : ""}`}
                    onClick={() => navigate(tab.path)}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
};

export default StudentDictionaryTabs;
