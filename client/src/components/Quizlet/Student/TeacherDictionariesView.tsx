import { useNavigate } from "react-router-dom";

import { TQuizletCatalog } from "api/quizlet";

import QuizletBreadcrumb, { QuizletBreadcrumbItem } from "../shared/QuizletBreadcrumb";
import { QuizletCardGrid, QuizletTopicCard, TopicsAndWordsCountMeta, WordsCountMeta } from "../shared/QuizletCards";
import StudentDictionaryTabs from "./StudentDictionaryTabs";
import { studentQuizletPaths } from "./studentQuizletRoutes";

const CELL_STYLE = { padding: "9px 14px" };

interface TeacherDictionariesViewProps {
    catalog: TQuizletCatalog;
    lessonId: number | null;
    topicId: number | null;
}

/** Словари учителя для ученика: уроки → темы урока → слова темы (только просмотр). */
const TeacherDictionariesView = ({ catalog, lessonId, topicId }: TeacherDictionariesViewProps) => {
    const navigate = useNavigate();
    const { groups, subgroups, subgroup_words: subgroupWords, words } = catalog;

    const selectedLesson = lessonId !== null ? (groups.find((group) => group.id === lessonId) ?? null) : null;
    const lessonTopics = selectedLesson ? subgroups.filter((subgroup) => subgroup.group_id === selectedLesson.id) : [];
    const selectedTopic = topicId !== null ? (lessonTopics.find((subgroup) => subgroup.id === topicId) ?? null) : null;
    const selectedTopicWordIds = new Set(
        subgroupWords.filter((link) => link.subgroup_id === selectedTopic?.id).map((link) => link.word_id),
    );
    const selectedTopicWords = selectedTopic ? words.filter((word) => selectedTopicWordIds.has(word.id)) : [];

    const countLinks = (subgroupIds: Set<number>) =>
        subgroupWords.filter((link) => subgroupIds.has(link.subgroup_id)).length;

    const breadcrumbItems: QuizletBreadcrumbItem[] = [
        {
            key: "root",
            label: "Словари сэнсэя",
            to: selectedLesson !== null ? studentQuizletPaths.view : undefined,
            active: selectedLesson === null,
        },
    ];
    if (selectedLesson !== null) {
        breadcrumbItems.push({
            key: "lesson",
            label: selectedLesson.title,
            to: selectedTopic !== null ? studentQuizletPaths.viewLesson(selectedLesson.id) : undefined,
            active: selectedTopic === null,
        });
    }
    if (selectedTopic !== null) {
        breadcrumbItems.push({ key: "topic", label: selectedTopic.title, active: true });
    }

    return (
        <div className="quizlet-student-dictionary-page">
            <StudentDictionaryTabs active="teacher" />

            <div className="quizlet-main-container">
                <div className="d-flex align-items-center justify-content-start flex-wrap gap-2 px-1 pt-1">
                    <QuizletBreadcrumb
                        items={breadcrumbItems}
                        className="mb-0 quizlet-teacher-breadcrumb quizlet-student-view-breadcrumb"
                    />
                </div>

                {groups.length === 0 && <div className="text-muted">Пока нет доступных уроков.</div>}

                {groups.length > 0 && selectedLesson === null && (
                    <QuizletCardGrid>
                        {groups.map((group) => {
                            const topicIds = new Set(
                                subgroups.filter((subgroup) => subgroup.group_id === group.id).map((item) => item.id),
                            );
                            return (
                                <QuizletTopicCard
                                    key={group.id}
                                    title={group.title}
                                    isTitleBold
                                    meta={
                                        <TopicsAndWordsCountMeta
                                            topicsCount={topicIds.size}
                                            wordsCount={countLinks(topicIds)}
                                        />
                                    }
                                    onClick={() => navigate(studentQuizletPaths.viewLesson(group.id))}
                                />
                            );
                        })}
                    </QuizletCardGrid>
                )}

                {selectedLesson !== null && selectedTopic === null && (
                    <>
                        {lessonTopics.length === 0 && (
                            <div className="text-muted small">В этом уроке пока нет тем.</div>
                        )}
                        {lessonTopics.length > 0 && (
                            <QuizletCardGrid>
                                {lessonTopics.map((subgroup) => (
                                    <QuizletTopicCard
                                        key={subgroup.id}
                                        title={subgroup.title}
                                        meta={<WordsCountMeta count={countLinks(new Set([subgroup.id]))} />}
                                        onClick={() =>
                                            navigate(studentQuizletPaths.viewTopic(selectedLesson.id, subgroup.id))
                                        }
                                    />
                                ))}
                            </QuizletCardGrid>
                        )}
                    </>
                )}

                {selectedLesson !== null && selectedTopic !== null && (
                    <div className="table-responsive" style={{ maxWidth: "800px" }}>
                        <table className="table table-bordered table-hover align-middle mb-0">
                            <thead>
                                <tr className="table-light">
                                    <th
                                        className="quizlet-dictionary-table-head"
                                        style={{ width: "28%", ...CELL_STYLE }}
                                    >
                                        Кандзи
                                    </th>
                                    <th
                                        className="quizlet-dictionary-table-head"
                                        style={{ width: "28%", ...CELL_STYLE }}
                                    >
                                        Чтение
                                    </th>
                                    <th
                                        className="quizlet-dictionary-table-head"
                                        style={{ width: "44%", ...CELL_STYLE }}
                                    >
                                        Перевод
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedTopicWords.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="text-muted small" style={CELL_STYLE}>
                                            Нет слов в этой теме.
                                        </td>
                                    </tr>
                                )}
                                {selectedTopicWords.map((word) => (
                                    <tr key={word.id}>
                                        <td style={CELL_STYLE}>{word.char_jp ?? ""}</td>
                                        <td style={CELL_STYLE}>{word.word_jp}</td>
                                        <td style={CELL_STYLE}>{word.ru}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeacherDictionariesView;
