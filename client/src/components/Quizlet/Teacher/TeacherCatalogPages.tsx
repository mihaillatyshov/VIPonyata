import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { TQuizletCatalog } from "api/quizlet";
import { TQuizletGroup, TQuizletSubgroup } from "models/TQuizlet";

import QuizletBreadcrumb, { QuizletBreadcrumbItem } from "../shared/QuizletBreadcrumb";
import { TopicsAndWordsCountMeta, WordsCountMeta } from "../shared/QuizletCards";
import QuizletWordsEditor from "../shared/QuizletWordsEditor";
import { useOutsideClickDismiss } from "../shared/useOutsideClickDismiss";
import EditableCardGrid from "./EditableCardGrid";
import { getSubgroupWords } from "./teacherQuizletUtils";
import { useTeacherCatalogActions } from "./useTeacherCatalogActions";
import { teacherQuizletPaths } from "./useTeacherQuizletView";

const TeacherCatalogBreadcrumbs = ({ group, subgroup }: { group?: TQuizletGroup; subgroup?: TQuizletSubgroup }) => {
    const items: QuizletBreadcrumbItem[] = [
        {
            key: "root",
            label: "Lessons",
            to: group ? teacherQuizletPaths.lessons : undefined,
            active: !group,
        },
    ];

    if (group) {
        items.push({
            key: "group",
            label: group.title,
            to: subgroup ? teacherQuizletPaths.lesson(group.id) : undefined,
            active: !subgroup,
        });
    }

    if (subgroup) {
        items.push({ key: "subgroup", label: subgroup.title, active: true });
    }

    return <QuizletBreadcrumb items={items} className="mb-3 quizlet-personal-breadcrumb quizlet-teacher-breadcrumb" />;
};

const countLinksBySubgroup = (catalog: TQuizletCatalog, subgroupIds: Set<number>) =>
    catalog.subgroup_words.filter((link) => subgroupIds.has(link.subgroup_id)).length;

export const TeacherLessonsPage = ({ catalog }: { catalog: TQuizletCatalog }) => {
    const navigate = useNavigate();
    const actions = useTeacherCatalogActions(catalog);

    return (
        <>
            <TeacherCatalogBreadcrumbs />
            <EditableCardGrid
                items={catalog.groups}
                createPlaceholder="Lesson title"
                createRowStyle={{ width: "min(100%, 360px)" }}
                emptyText="No lessons yet. Create the first lesson."
                isTitleBold
                renderMeta={(group) => {
                    const topicIds = new Set(
                        catalog.subgroups.filter((subgroup) => subgroup.group_id === group.id).map((item) => item.id),
                    );
                    return (
                        <TopicsAndWordsCountMeta
                            topicsCount={topicIds.size}
                            wordsCount={countLinksBySubgroup(catalog, topicIds)}
                        />
                    );
                }}
                onOpen={(group) => navigate(teacherQuizletPaths.lesson(group.id))}
                onCreate={async (title) => {
                    const group = await actions.createLesson(title);
                    navigate(teacherQuizletPaths.lesson(group.id));
                }}
                onRename={actions.renameLesson}
                onMove={(group, direction) => actions.moveLesson(group.id, direction)}
                onDelete={actions.deleteLesson}
            />
        </>
    );
};

export const TeacherLessonPage = ({ catalog, group }: { catalog: TQuizletCatalog; group: TQuizletGroup }) => {
    const navigate = useNavigate();
    const actions = useTeacherCatalogActions(catalog);
    const topics = catalog.subgroups.filter((subgroup) => subgroup.group_id === group.id);

    return (
        <>
            <TeacherCatalogBreadcrumbs group={group} />
            <EditableCardGrid
                items={topics}
                createPlaceholder="Topic title"
                emptyText="No topics yet. Create a topic above."
                renderMeta={(subgroup) => (
                    <WordsCountMeta count={countLinksBySubgroup(catalog, new Set([subgroup.id]))} />
                )}
                onOpen={(subgroup) => navigate(teacherQuizletPaths.topic(subgroup.id))}
                onCreate={async (title) => {
                    const subgroup = await actions.createTopic(group.id, title);
                    navigate(teacherQuizletPaths.topic(subgroup.id));
                }}
                onRename={actions.renameTopic}
                onMove={(subgroup, direction) => actions.moveTopic(group.id, subgroup.id, direction)}
                onDelete={actions.deleteTopic}
            />
        </>
    );
};

const TopicDeleteHeaderAction = ({ onDelete }: { onDelete: () => void }) => {
    const [isConfirming, setIsConfirming] = useState(false);

    useOutsideClickDismiss(isConfirming, ".quizlet-editor-delete-confirm-wrap", () => setIsConfirming(false));

    return (
        <div className="d-flex align-items-center justify-content-center gap-2 quizlet-editor-delete-confirm-wrap">
            {isConfirming ? (
                <button
                    className="btn btn-sm btn-danger"
                    onClick={() => {
                        setIsConfirming(false);
                        onDelete();
                    }}
                >
                    Точно?
                </button>
            ) : (
                <button
                    className="btn btn-sm btn-link p-0 text-danger quizlet-personal-topic-row-delete-btn"
                    title="Удалить"
                    onClick={() => setIsConfirming(true)}
                >
                    ×
                </button>
            )}
        </div>
    );
};

interface TeacherTopicPageProps {
    catalog: TQuizletCatalog;
    group: TQuizletGroup;
    subgroup: TQuizletSubgroup;
}

export const TeacherTopicPage = ({ catalog, group, subgroup }: TeacherTopicPageProps) => {
    const navigate = useNavigate();
    const actions = useTeacherCatalogActions(catalog);

    const handleDelete = async () => {
        await actions.deleteTopic(subgroup);
        navigate(teacherQuizletPaths.lesson(group.id));
    };

    return (
        <>
            <TeacherCatalogBreadcrumbs group={group} subgroup={subgroup} />
            <div className="quizlet-main-container">
                <QuizletWordsEditor
                    key={subgroup.id}
                    initialWords={getSubgroupWords(catalog, subgroup.id)}
                    onSave={(changes) => actions.saveTopicWords(subgroup, changes)}
                    readingLabel="Кана"
                    alwaysShowSaveButton
                    headerAction={<TopicDeleteHeaderAction onDelete={handleDelete} />}
                />
            </div>
        </>
    );
};

export const TeacherNotFound = ({ title, text }: { title: string; text: string }) => {
    const navigate = useNavigate();

    return (
        <div className="quizlet-main-container">
            <h5 className="mb-2">{title}</h5>
            <p className="text-muted mb-3">{text}</p>
            <div>
                <button className="btn btn-outline-primary" onClick={() => navigate(teacherQuizletPaths.lessons)}>
                    Back to lessons
                </button>
            </div>
        </div>
    );
};
