import { useNavigate } from "react-router-dom";

import { studentQuizletPaths } from "./studentQuizletRoutes";

const MODES = [
    {
        path: studentQuizletPaths.view,
        className: "quizlet-mode-button-view",
        icon: "/img/icons/icon_silkscroll.png",
        label: "Все словари",
    },
    {
        path: studentQuizletPaths.setup,
        className: "quizlet-mode-button-training",
        icon: "/img/icons/icon_torii.png",
        label: "Потренируемся?",
    },
    {
        path: studentQuizletPaths.progress,
        className: "quizlet-mode-button-progress",
        icon: "/img/icons/icon_sakura.png",
        label: "Мои успехи",
    },
];

const StudentQuizletModeSelection = () => {
    const navigate = useNavigate();

    return (
        <div className="mx-auto mt-5" style={{ maxWidth: "760px" }}>
            <div className="d-flex justify-content-center align-items-center flex-wrap gap-4">
                {MODES.map((mode) => (
                    <button
                        key={mode.path}
                        className={`btn quizlet-mode-button ${mode.className} quizlet-mode-button-rect d-flex flex-column justify-content-center align-items-center`}
                        style={{ width: "220px", height: "140px" }}
                        onClick={() => navigate(mode.path)}
                    >
                        <span className="quizlet-mode-icon quizlet-mode-icon-bg" aria-hidden="true">
                            <img className="quizlet-mode-icon-image" src={mode.icon} alt="" />
                        </span>
                        <span className="quizlet-mode-label">{mode.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default StudentQuizletModeSelection;
