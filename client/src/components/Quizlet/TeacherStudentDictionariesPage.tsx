import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import Loading from "components/Common/Loading";
import ErrorPage from "components/ErrorPages/ErrorPage";
import { AjaxDelete, AjaxGet, AjaxPatch, AjaxPost } from "libs/ServerAPI";
import { LoadStatus } from "libs/Status";
import { TQuizletLesson, TQuizletSubgroup, TQuizletWord } from "models/TQuizlet";

interface StudentCard {
    id: number;
    name: string;
    nickname: string;
    has_personal_dictionary: boolean;
}

interface StudentsResponse {
    students: StudentCard[];
}

interface StudentPersonalDictionaryResponse {
    lesson: TQuizletLesson | null;
    subgroups: TQuizletSubgroup[];
    words: TQuizletWord[];
}

interface EditorRow {
    key: string;
    id?: number;
    char_jp: string;
    word_jp: string;
    ru: string;
}

type ColField = "char_jp" | "word_jp" | "ru";

const COLS: ColField[] = ["char_jp", "word_jp", "ru"];

let rowKeyCounter = 0;
const makeKey = () => `row_${++rowKeyCounter}`;
const makeEmptyRow = (): EditorRow => ({ key: makeKey(), char_jp: "", word_jp: "", ru: "" });

const isAllEmpty = (row: EditorRow) => row.char_jp.trim() === "" && row.word_jp.trim() === "" && row.ru.trim() === "";

const wordsToRows = (words: TQuizletWord[]): EditorRow[] =>
    words.map((word) => ({
        key: makeKey(),
        id: word.id,
        char_jp: word.char_jp ?? "",
        word_jp: word.word_jp,
        ru: word.ru,
    }));

interface TopicEditorProps {
    studentId: number;
    subgroup: TQuizletSubgroup;
    initialWords: TQuizletWord[];
    onSaved: () => void;
}

const TopicEditor = ({ studentId, subgroup, initialWords, onSaved }: TopicEditorProps) => {
    const [rows, setRows] = useState<EditorRow[]>(() =>
        initialWords.length > 0 ? wordsToRows(initialWords) : [makeEmptyRow()],
    );
    const [deletedIds, setDeletedIds] = useState<number[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    const tableRef = useRef<HTMLTableElement>(null);
    const focusPending = useRef<{ rowIndex: number; col: number } | null>(null);

    useEffect(() => {
        setRows(initialWords.length > 0 ? wordsToRows(initialWords) : [makeEmptyRow()]);
        setDeletedIds([]);
    }, [subgroup.id, initialWords]);

    useEffect(() => {
        if (!focusPending.current) {
            return;
        }

        const { rowIndex, col } = focusPending.current;
        focusPending.current = null;

        const tbody = tableRef.current?.querySelector("tbody");
        if (!tbody) {
            return;
        }

        const input = tbody.rows[rowIndex]?.cells[col]?.querySelector<HTMLInputElement>("input");
        input?.focus();
        input?.select();
    }, [rows]);

    const requestFocus = (rowIndex: number, col: number) => {
        focusPending.current = { rowIndex, col };
    };

    const updateCell = (rowKey: string, field: ColField, value: string) => {
        setRows((prev) => prev.map((row) => (row.key === rowKey ? { ...row, [field]: value } : row)));
    };

    const addRowAfter = (afterIndex: number) => {
        const newRow = makeEmptyRow();
        setRows((prev) => {
            const next = [...prev];
            next.splice(afterIndex + 1, 0, newRow);
            return next;
        });
        requestFocus(afterIndex + 1, 0);
    };

    const removeRow = (rowIndex: number) => {
        const row = rows[rowIndex];
        if (row.id !== undefined) {
            setDeletedIds((prev) => [...prev, row.id!]);
        }

        setRows((prev) => {
            const next = prev.filter((_, index) => index !== rowIndex);
            return next.length > 0 ? next : [makeEmptyRow()];
        });
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>, rowIndex: number, colIndex: number) => {
        if (event.key === "Enter") {
            event.preventDefault();
            if (rowIndex === rows.length - 1) {
                addRowAfter(rowIndex);
            } else {
                requestFocus(rowIndex + 1, 0);
                setRows((prev) => [...prev]);
            }
            return;
        }

        if (event.key !== "Tab") {
            return;
        }

        const nextCol = colIndex + (event.shiftKey ? -1 : 1);

        if (nextCol >= 0 && nextCol < COLS.length) {
            event.preventDefault();
            requestFocus(rowIndex, nextCol);
            setRows((prev) => [...prev]);
            return;
        }

        if (!event.shiftKey && nextCol >= COLS.length) {
            event.preventDefault();
            if (rowIndex < rows.length - 1) {
                requestFocus(rowIndex + 1, 0);
                setRows((prev) => [...prev]);
            } else {
                addRowAfter(rowIndex);
            }
            return;
        }

        if (event.shiftKey && nextCol < 0 && rowIndex > 0) {
            event.preventDefault();
            requestFocus(rowIndex - 1, COLS.length - 1);
            setRows((prev) => [...prev]);
        }
    };

    const handlePaste = (event: React.ClipboardEvent<HTMLTableElement>) => {
        const text = event.clipboardData.getData("text");
        if (!text.includes("\t") && !text.includes("\n")) {
            return;
        }

        event.preventDefault();

        const pastedRows: EditorRow[] = text
            .split(/\r?\n/)
            .filter((line) => line.trim() !== "")
            .map((line) => {
                const cells = line.split("\t").map((cell) => cell.trim());
                return {
                    key: makeKey(),
                    char_jp: cells[0] ?? "",
                    word_jp: cells[1] ?? "",
                    ru: cells[2] ?? "",
                };
            });

        if (pastedRows.length === 0) {
            return;
        }

        setRows((prev) => {
            const nonEmptyRows = prev.filter((row) => !isAllEmpty(row));
            return [...nonEmptyRows, ...pastedRows];
        });
    };

    const handleSave = async () => {
        setIsSaving(true);
        setSaveError(null);

        try {
            const nonEmpty = rows.filter((row) => !isAllEmpty(row));
            const toCreate = nonEmpty.filter((row) => row.id === undefined);
            const toUpdate = nonEmpty.filter((row) => row.id !== undefined);

            await AjaxPost({
                url: `/api/quizlet/students-dictionaries/${studentId}/words-batch`,
                body: {
                    subgroup_id: subgroup.id,
                    deleted_ids: deletedIds,
                    created: toCreate.map((row) => ({
                        subgroup_id: subgroup.id,
                        char_jp: row.char_jp.trim() || null,
                        word_jp: row.word_jp,
                        ru: row.ru,
                    })),
                    updated: toUpdate.map((row) => ({
                        id: row.id,
                        char_jp: row.char_jp.trim() || null,
                        word_jp: row.word_jp,
                        ru: row.ru,
                    })),
                },
            });

            await onSaved();
        } catch {
            setSaveError("Ошибка при сохранении");
        } finally {
            setIsSaving(false);
        }
    };

    const hasChanges = useMemo(() => {
        const nonEmptyRows = rows.filter((row) => !isAllEmpty(row));
        const hasCreated = nonEmptyRows.some((row) => row.id === undefined);
        const hasDeleted = deletedIds.length > 0;
        const hasUpdated = nonEmptyRows
            .filter((row) => row.id !== undefined)
            .some((row) => {
                const initialWord = initialWords.find((word) => word.id === row.id);
                if (!initialWord) {
                    return true;
                }

                return (
                    (initialWord.char_jp ?? "") !== row.char_jp ||
                    initialWord.word_jp !== row.word_jp ||
                    initialWord.ru !== row.ru
                );
            });

        return hasCreated || hasDeleted || hasUpdated;
    }, [rows, deletedIds, initialWords]);

    return (
        <div className="quizlet-personal-topic-editor">
            <div className="table-responsive quizlet-personal-topic-editor-table-wrap">
                <table
                    ref={tableRef}
                    className="table table-sm table-bordered align-middle mb-1 quizlet-personal-topic-editor-table"
                    onPaste={handlePaste}
                >
                    <thead>
                        <tr className="table-light">
                            <th className="quizlet-dictionary-table-head" style={{ width: "28%" }}>
                                Кандзи
                            </th>
                            <th className="quizlet-dictionary-table-head" style={{ width: "28%" }}>
                                Чтение
                            </th>
                            <th className="quizlet-dictionary-table-head" style={{ width: "37%" }}>
                                Перевод
                            </th>
                            <th style={{ width: "5%" }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, rowIndex) => (
                            <tr key={row.key}>
                                {COLS.map((field, colIndex) => (
                                    <td key={field} className="p-0">
                                        <input
                                            type="text"
                                            className="form-control form-control-sm border-0 rounded-0 shadow-none quizlet-personal-topic-editor-input"
                                            style={{ background: "transparent" }}
                                            value={row[field]}
                                            onChange={(event) => updateCell(row.key, field, event.target.value)}
                                            onKeyDown={(event) => handleKeyDown(event, rowIndex, colIndex)}
                                        />
                                    </td>
                                ))}
                                <td className="text-center p-0">
                                    <button
                                        className="btn btn-sm btn-link text-danger p-1 lh-1 quizlet-personal-topic-row-delete-btn"
                                        onClick={() => removeRow(rowIndex)}
                                        title="Удалить строку"
                                    >
                                        ×
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="d-flex justify-content-between align-items-center mt-1">
                <button className="btn btn-sm btn-outline-secondary" onClick={() => addRowAfter(rows.length - 1)}>
                    + Добавить строку
                </button>
                <div className="d-flex align-items-center gap-2">
                    {saveError && <span className="text-danger small">{saveError}</span>}
                    {(hasChanges || isSaving) && (
                        <button className="btn btn-success" onClick={handleSave} disabled={isSaving}>
                            {isSaving ? "Сохранение..." : "Сохранить"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

interface TeacherStudentDictionariesPageProps {
    selectedStudentId?: number;
    selectedTopicId?: number;
}

const TeacherStudentDictionariesPage = ({
    selectedStudentId,
    selectedTopicId,
}: TeacherStudentDictionariesPageProps) => {
    const navigate = useNavigate();

    const [studentsStatus, setStudentsStatus] = useState<LoadStatus.Type>(LoadStatus.NONE);
    const [students, setStudents] = useState<StudentCard[]>([]);

    const [detailsStatus, setDetailsStatus] = useState<LoadStatus.Type>(LoadStatus.NONE);
    const [lesson, setLesson] = useState<TQuizletLesson | null>(null);
    const [subgroups, setSubgroups] = useState<TQuizletSubgroup[]>([]);
    const [words, setWords] = useState<TQuizletWord[]>([]);

    const [lessonTitleDraft, setLessonTitleDraft] = useState("");
    const [newTopicTitle, setNewTopicTitle] = useState("");
    const [topicTitleDraft, setTopicTitleDraft] = useState("");
    const [isDeleteTopicConfirming, setIsDeleteTopicConfirming] = useState(false);

    const selectedStudent = useMemo(
        () => students.find((student) => student.id === selectedStudentId) ?? null,
        [students, selectedStudentId],
    );

    const selectedSubgroup = useMemo(
        () => subgroups.find((subgroup) => subgroup.id === selectedTopicId) ?? null,
        [subgroups, selectedTopicId],
    );

    const selectedSubgroupWords = useMemo(() => {
        if (selectedTopicId === undefined) {
            return [];
        }

        return words.filter((word) => word.subgroup_id === selectedTopicId);
    }, [words, selectedTopicId]);

    const fetchStudents = () => {
        setStudentsStatus(LoadStatus.LOADING);
        return AjaxGet<StudentsResponse>({ url: "/api/quizlet/students-dictionaries" })
            .then((json) => {
                setStudents(json.students);
                setStudentsStatus(LoadStatus.DONE);
            })
            .catch(() => {
                setStudentsStatus(LoadStatus.ERROR);
            });
    };

    const fetchStudentDetails = (studentId: number) => {
        setDetailsStatus(LoadStatus.LOADING);
        return AjaxGet<StudentPersonalDictionaryResponse>({ url: `/api/quizlet/students-dictionaries/${studentId}` })
            .then((json) => {
                setLesson(json.lesson);
                setSubgroups(json.subgroups);
                setWords(json.words);
                setLessonTitleDraft(json.lesson?.title ?? "");
                setDetailsStatus(LoadStatus.DONE);
            })
            .catch(() => {
                setDetailsStatus(LoadStatus.ERROR);
            });
    };

    useEffect(() => {
        fetchStudents();
    }, []);

    useEffect(() => {
        if (selectedStudentId === undefined) {
            setDetailsStatus(LoadStatus.NONE);
            return;
        }

        fetchStudentDetails(selectedStudentId);
    }, [selectedStudentId]);

    useEffect(() => {
        if (selectedTopicId === undefined) {
            setTopicTitleDraft("");
            setIsDeleteTopicConfirming(false);
            return;
        }

        const subgroup = subgroups.find((item) => item.id === selectedTopicId);
        setTopicTitleDraft(subgroup?.title ?? "");
        setIsDeleteTopicConfirming(false);
    }, [selectedTopicId, subgroups]);

    const ensureLesson = async () => {
        if (selectedStudentId === undefined || lessonTitleDraft.trim().length === 0) {
            return;
        }

        if (lesson === null) {
            await AjaxPost({
                url: `/api/quizlet/students-dictionaries/${selectedStudentId}/lesson`,
                body: { title: lessonTitleDraft.trim() },
            });
        } else {
            await AjaxPatch({
                url: `/api/quizlet/students-dictionaries/${selectedStudentId}/lesson`,
                body: { title: lessonTitleDraft.trim() },
            });
        }

        await fetchStudentDetails(selectedStudentId);
    };

    const addSubgroup = async () => {
        if (selectedStudentId === undefined || newTopicTitle.trim().length === 0) {
            return;
        }

        const resp = await AjaxPost<{ subgroup: TQuizletSubgroup }>({
            url: `/api/quizlet/students-dictionaries/${selectedStudentId}/subgroups`,
            body: { title: newTopicTitle.trim() },
        });

        setNewTopicTitle("");
        await fetchStudentDetails(selectedStudentId);
        navigate(`/quizlet/students-dictionaries/${selectedStudentId}/topics/${resp.subgroup.id}`);
    };

    const renameSubgroup = async () => {
        if (selectedStudentId === undefined || selectedSubgroup === null || topicTitleDraft.trim().length === 0) {
            return;
        }

        await AjaxPatch({
            url: `/api/quizlet/students-dictionaries/${selectedStudentId}/subgroups/${selectedSubgroup.id}`,
            body: { title: topicTitleDraft.trim() },
        });

        await fetchStudentDetails(selectedStudentId);
    };

    const deleteSubgroup = async () => {
        if (selectedStudentId === undefined || selectedSubgroup === null) {
            return;
        }

        setIsDeleteTopicConfirming(false);
        await AjaxDelete({
            url: `/api/quizlet/students-dictionaries/${selectedStudentId}/subgroups/${selectedSubgroup.id}`,
        });

        await fetchStudentDetails(selectedStudentId);
        navigate(`/quizlet/students-dictionaries/${selectedStudentId}`);
    };

    if (studentsStatus === LoadStatus.ERROR || detailsStatus === LoadStatus.ERROR) {
        return (
            <ErrorPage
                errorImg="/svg/SomethingWrong.svg"
                textMain="Не удалось загрузить словари учеников"
                textDisabled="Попробуйте перезагрузить страницу"
            />
        );
    }

    if (studentsStatus !== LoadStatus.DONE || (selectedStudentId !== undefined && detailsStatus !== LoadStatus.DONE)) {
        return <Loading />;
    }

    return (
        <div className="quizlet-main-container">
            {selectedStudentId === undefined && (
                <>
                    <h5 className="mb-3">Словари учеников</h5>
                    {students.length === 0 && <div className="text-muted">Пока нет учеников</div>}
                    {students.length > 0 && (
                        <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-2 pt-1">
                            {students.map((student) => (
                                <div className="col" key={student.id}>
                                    <button
                                        className="btn w-100 text-start p-0 border-0 quizlet-topic-card-btn"
                                        onClick={() => navigate(`/quizlet/students-dictionaries/${student.id}`)}
                                    >
                                        <div className="card quizlet-topic-card h-100">
                                            <div className="card-body d-flex flex-column justify-content-between">
                                                <span className="quizlet-topic-card__title fw-semibold">
                                                    {student.nickname}
                                                </span>
                                                <span className="quizlet-topic-card__count text-muted mt-2">
                                                    {student.name}
                                                </span>
                                                {!student.has_personal_dictionary && (
                                                    <span className="small text-warning mt-2">
                                                        Словарь еще не создан
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {selectedStudentId !== undefined && (
                <>
                    <nav
                        aria-label="breadcrumb"
                        className="mb-3 quizlet-teacher-breadcrumb quizlet-student-view-breadcrumb"
                    >
                        <ol className="breadcrumb mb-0">
                            <li className="breadcrumb-item">
                                <Link to="/quizlet/students-dictionaries">Словари учеников</Link>
                            </li>
                            <li
                                className={`breadcrumb-item${selectedTopicId === undefined ? " active" : ""}`}
                                aria-current={selectedTopicId === undefined ? "page" : undefined}
                            >
                                {selectedTopicId !== undefined ? (
                                    <Link to={`/quizlet/students-dictionaries/${selectedStudentId}`}>
                                        {selectedStudent?.nickname ?? `Ученик #${selectedStudentId}`}
                                    </Link>
                                ) : (
                                    (selectedStudent?.nickname ?? `Ученик #${selectedStudentId}`)
                                )}
                            </li>
                            {selectedTopicId !== undefined && (
                                <li className="breadcrumb-item active" aria-current="page">
                                    {selectedSubgroup?.title ?? `Тема #${selectedTopicId}`}
                                </li>
                            )}
                        </ol>
                    </nav>

                    <div className="mb-3 fw-semibold">{selectedStudent?.name ?? ""}</div>

                    {lesson === null && (
                        <div className="d-flex gap-2 mb-3" style={{ width: "min(100%, 520px)" }}>
                            <input
                                className="form-control"
                                value={lessonTitleDraft}
                                onChange={(event) => setLessonTitleDraft(event.target.value)}
                                placeholder="Название словаря ученика"
                            />
                            <button className="btn btn-outline-primary" onClick={ensureLesson}>
                                Создать
                            </button>
                        </div>
                    )}

                    {lesson !== null && selectedSubgroup === null && selectedTopicId === undefined && (
                        <>
                            <div className="d-flex gap-2 mb-3" style={{ width: "min(100%, 560px)" }}>
                                <input
                                    className="form-control"
                                    value={lessonTitleDraft}
                                    onChange={(event) => setLessonTitleDraft(event.target.value)}
                                    onBlur={ensureLesson}
                                />
                            </div>

                            <div className="mb-3 d-flex gap-2 align-items-center quizlet-personal-topic-create-row">
                                <input
                                    className="form-control quizlet-personal-topic-create-input"
                                    value={newTopicTitle}
                                    onChange={(event) => setNewTopicTitle(event.target.value)}
                                    placeholder="Новая тема..."
                                    onKeyDown={(event) => {
                                        if (event.key === "Enter") {
                                            addSubgroup();
                                        }
                                    }}
                                />
                                <button
                                    className="btn btn-success btn-sm quizlet-personal-topic-create-btn"
                                    onClick={addSubgroup}
                                >
                                    + Добавить
                                </button>
                            </div>

                            {subgroups.length === 0 && <div className="text-muted">Тем пока нет</div>}
                            {subgroups.length > 0 && (
                                <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-2 pt-1">
                                    {subgroups.map((subgroup) => {
                                        const wordCount = words.filter(
                                            (word) => word.subgroup_id === subgroup.id,
                                        ).length;
                                        return (
                                            <div className="col" key={subgroup.id}>
                                                <button
                                                    className="btn w-100 text-start p-0 border-0 quizlet-topic-card-btn"
                                                    onClick={() =>
                                                        navigate(
                                                            `/quizlet/students-dictionaries/${selectedStudentId}/topics/${subgroup.id}`,
                                                        )
                                                    }
                                                >
                                                    <div className="card quizlet-topic-card h-100">
                                                        <div className="card-body d-flex flex-column justify-content-between">
                                                            <span className="quizlet-topic-card__title">
                                                                {subgroup.title}
                                                            </span>
                                                            <span className="quizlet-topic-card__count text-muted mt-2">
                                                                <i className="bi bi-card-text me-1" />
                                                                {wordCount} слов
                                                            </span>
                                                        </div>
                                                    </div>
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    )}

                    {lesson !== null && selectedSubgroup !== null && selectedTopicId !== undefined && (
                        <>
                            <div className="d-flex justify-content-between align-items-center gap-2 mb-3">
                                <input
                                    className="form-control"
                                    style={{ maxWidth: "520px" }}
                                    value={topicTitleDraft}
                                    onChange={(event) => setTopicTitleDraft(event.target.value)}
                                    onBlur={renameSubgroup}
                                />
                                <div className="d-flex gap-2">
                                    {isDeleteTopicConfirming ? (
                                        <>
                                            <button className="btn btn-danger btn-sm" onClick={deleteSubgroup}>
                                                Точно?
                                            </button>
                                            <button
                                                className="btn btn-outline-secondary btn-sm"
                                                onClick={() => setIsDeleteTopicConfirming(false)}
                                            >
                                                Отмена
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            className="btn btn-outline-danger"
                                            onClick={() => setIsDeleteTopicConfirming(true)}
                                        >
                                            Удалить тему
                                        </button>
                                    )}
                                </div>
                            </div>

                            <TopicEditor
                                studentId={selectedStudentId}
                                subgroup={selectedSubgroup}
                                initialWords={selectedSubgroupWords}
                                onSaved={() => fetchStudentDetails(selectedStudentId)}
                            />
                        </>
                    )}
                </>
            )}
        </div>
    );
};

export default TeacherStudentDictionariesPage;
