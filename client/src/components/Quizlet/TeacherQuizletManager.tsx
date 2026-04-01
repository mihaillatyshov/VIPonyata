import { useEffect, useMemo, useState } from "react";

import Loading from "components/Common/Loading";
import PageTitle from "components/Common/PageTitle";
import ErrorPage from "components/ErrorPages/ErrorPage";
import { AjaxDelete, AjaxGet, AjaxPatch, AjaxPost } from "libs/ServerAPI";
import { LoadStatus } from "libs/Status";
import { TQuizletGroup, TQuizletSubgroup, TQuizletSubgroupWord, TQuizletWord } from "models/TQuizlet";

interface CatalogResponse {
    groups: TQuizletGroup[];
    subgroups: TQuizletSubgroup[];
    subgroup_words: TQuizletSubgroupWord[];
    words: TQuizletWord[];
}

const TeacherQuizletManager = () => {
    const [loadStatus, setLoadStatus] = useState<LoadStatus.Type>(LoadStatus.NONE);
    const [groups, setGroups] = useState<TQuizletGroup[]>([]);
    const [subgroups, setSubgroups] = useState<TQuizletSubgroup[]>([]);
    const [subgroupWords, setSubgroupWords] = useState<TQuizletSubgroupWord[]>([]);
    const [words, setWords] = useState<TQuizletWord[]>([]);

    const [newGroupTitle, setNewGroupTitle] = useState<string>("");
    const [newSubgroup, setNewSubgroup] = useState<{ groupId: number; title: string }>({ groupId: 0, title: "" });
    const [newWord, setNewWord] = useState<{ subgroup_id: number; char_jp: string; word_jp: string; ru: string }>({
        subgroup_id: 0,
        char_jp: "",
        word_jp: "",
        ru: "",
    });

    const fetchCatalog = () => {
        setLoadStatus(LoadStatus.LOADING);
        AjaxGet<CatalogResponse>({ url: "/api/quizlet/groups" })
            .then((json) => {
                setGroups(json.groups);
                setSubgroups(json.subgroups);
                setSubgroupWords(json.subgroup_words);
                setWords(json.words);
                setLoadStatus(LoadStatus.DONE);
            })
            .catch(() => setLoadStatus(LoadStatus.ERROR));
    };

    useEffect(() => {
        fetchCatalog();
    }, []);

    const groupedSubgroups = useMemo(() => {
        return groups.map((group) => ({
            group,
            subgroups: subgroups.filter((subgroup) => subgroup.group_id === group.id),
        }));
    }, [groups, subgroups]);

    const getSubgroupWords = (subgroupId: number) => {
        const ids = subgroupWords.filter((item) => item.subgroup_id === subgroupId).map((item) => item.word_id);
        return words.filter((word) => ids.includes(word.id));
    };

    if (loadStatus === LoadStatus.ERROR) {
        return (
            <ErrorPage
                errorImg="/svg/SomethingWrong.svg"
                textMain="Не удалось загрузить Quizlet manager"
                textDisabled="Попробуйте перезагрузить страницу"
            />
        );
    }

    if (loadStatus !== LoadStatus.DONE) {
        return <Loading />;
    }

    return (
        <div className="container">
            <PageTitle title="Quizlet manager" />

            <div className="card p-3 p-md-4 mb-3">
                <h5 className="mb-3">Новая группа</h5>
                <div className="d-flex gap-2">
                    <input
                        className="form-control"
                        value={newGroupTitle}
                        onChange={(e) => setNewGroupTitle(e.target.value)}
                        placeholder="Название группы"
                    />
                    <button
                        className="btn btn-primary"
                        onClick={() => {
                            if (newGroupTitle.trim().length === 0) {
                                return;
                            }
                            AjaxPost({ url: "/api/quizlet/groups", body: { title: newGroupTitle } }).then(() => {
                                setNewGroupTitle("");
                                fetchCatalog();
                            });
                        }}
                    >
                        Добавить
                    </button>
                </div>
            </div>

            <div className="card p-3 p-md-4 mb-3">
                <h5 className="mb-3">Новая подгруппа</h5>
                <div className="row g-2">
                    <div className="col-12 col-md-4">
                        <select
                            className="form-select"
                            value={newSubgroup.groupId}
                            onChange={(e) => setNewSubgroup({ ...newSubgroup, groupId: Number(e.target.value) })}
                        >
                            <option value={0}>Выберите группу</option>
                            {groups.map((group) => (
                                <option key={group.id} value={group.id}>
                                    {group.title}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="col-12 col-md-6">
                        <input
                            className="form-control"
                            value={newSubgroup.title}
                            onChange={(e) => setNewSubgroup({ ...newSubgroup, title: e.target.value })}
                            placeholder="Название подгруппы"
                        />
                    </div>
                    <div className="col-12 col-md-2 d-grid">
                        <button
                            className="btn btn-primary"
                            onClick={() => {
                                if (newSubgroup.groupId <= 0 || newSubgroup.title.trim().length === 0) {
                                    return;
                                }
                                AjaxPost({
                                    url: `/api/quizlet/groups/${newSubgroup.groupId}/subgroups`,
                                    body: { title: newSubgroup.title },
                                }).then(() => {
                                    setNewSubgroup({ groupId: 0, title: "" });
                                    fetchCatalog();
                                });
                            }}
                        >
                            Добавить
                        </button>
                    </div>
                </div>
            </div>

            <div className="card p-3 p-md-4 mb-3">
                <h5 className="mb-3">Новое слово</h5>
                <div className="row g-2">
                    <div className="col-12 col-md-3">
                        <select
                            className="form-select"
                            value={newWord.subgroup_id}
                            onChange={(e) => setNewWord({ ...newWord, subgroup_id: Number(e.target.value) })}
                        >
                            <option value={0}>Подгруппа</option>
                            {subgroups.map((subgroup) => (
                                <option key={subgroup.id} value={subgroup.id}>
                                    {subgroup.title}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="col-12 col-md-3">
                        <input
                            className="form-control"
                            value={newWord.char_jp}
                            onChange={(e) => setNewWord({ ...newWord, char_jp: e.target.value })}
                            placeholder="char_jp"
                        />
                    </div>
                    <div className="col-12 col-md-3">
                        <input
                            className="form-control"
                            value={newWord.word_jp}
                            onChange={(e) => setNewWord({ ...newWord, word_jp: e.target.value })}
                            placeholder="word_jp"
                        />
                    </div>
                    <div className="col-12 col-md-2">
                        <input
                            className="form-control"
                            value={newWord.ru}
                            onChange={(e) => setNewWord({ ...newWord, ru: e.target.value })}
                            placeholder="ru"
                        />
                    </div>
                    <div className="col-12 col-md-1 d-grid">
                        <button
                            className="btn btn-primary"
                            onClick={() => {
                                if (
                                    newWord.subgroup_id <= 0 ||
                                    newWord.word_jp.trim().length === 0 ||
                                    newWord.ru.trim().length === 0
                                ) {
                                    return;
                                }
                                AjaxPost({ url: "/api/quizlet/words", body: newWord }).then(() => {
                                    setNewWord({ subgroup_id: 0, char_jp: "", word_jp: "", ru: "" });
                                    fetchCatalog();
                                });
                            }}
                        >
                            +
                        </button>
                    </div>
                </div>
            </div>

            {groupedSubgroups.map(({ group, subgroups: groupSubgroups }) => (
                <div key={group.id} className="card p-3 p-md-4 mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <h5 className="mb-0">{group.title}</h5>
                        <div className="d-flex gap-2">
                            <button
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() => {
                                    const title = window.prompt("Новое название группы", group.title);
                                    if (title === null || title.trim().length === 0) {
                                        return;
                                    }
                                    AjaxPatch({ url: `/api/quizlet/groups/${group.id}`, body: { title } }).then(() =>
                                        fetchCatalog(),
                                    );
                                }}
                            >
                                Переименовать
                            </button>
                            <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => {
                                    AjaxDelete({ url: `/api/quizlet/groups/${group.id}` }).then(() => fetchCatalog());
                                }}
                            >
                                Удалить
                            </button>
                        </div>
                    </div>

                    {groupSubgroups.map((subgroup) => (
                        <div key={subgroup.id} className="border rounded p-2 mb-2">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <strong>{subgroup.title}</strong>
                                <div className="d-flex gap-2">
                                    <button
                                        className="btn btn-sm btn-outline-secondary"
                                        onClick={() => {
                                            const title = window.prompt("Новое название подгруппы", subgroup.title);
                                            if (title === null || title.trim().length === 0) {
                                                return;
                                            }
                                            AjaxPatch({
                                                url: `/api/quizlet/subgroups/${subgroup.id}`,
                                                body: { title },
                                            }).then(() => fetchCatalog());
                                        }}
                                    >
                                        Переименовать
                                    </button>
                                    <button
                                        className="btn btn-sm btn-outline-danger"
                                        onClick={() => {
                                            AjaxDelete({ url: `/api/quizlet/subgroups/${subgroup.id}` }).then(() =>
                                                fetchCatalog(),
                                            );
                                        }}
                                    >
                                        Удалить
                                    </button>
                                </div>
                            </div>

                            <div className="table-responsive">
                                <table className="table table-sm align-middle mb-0">
                                    <thead>
                                        <tr>
                                            <th>char_jp</th>
                                            <th>word_jp</th>
                                            <th>ru</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {getSubgroupWords(subgroup.id).map((word) => (
                                            <tr key={word.id}>
                                                <td>{word.char_jp ?? "-"}</td>
                                                <td>{word.word_jp}</td>
                                                <td>{word.ru}</td>
                                                <td className="text-end">
                                                    <button
                                                        className="btn btn-sm btn-outline-secondary me-2"
                                                        onClick={() => {
                                                            const ru = window.prompt("ru", word.ru);
                                                            const wordJp = window.prompt("word_jp", word.word_jp);
                                                            const charJp = window.prompt("char_jp", word.char_jp ?? "");
                                                            if (ru === null || wordJp === null || ru.trim() === "") {
                                                                return;
                                                            }
                                                            AjaxPatch({
                                                                url: `/api/quizlet/words/${word.id}`,
                                                                body: {
                                                                    ru,
                                                                    word_jp: wordJp,
                                                                    char_jp: charJp,
                                                                },
                                                            }).then(() => fetchCatalog());
                                                        }}
                                                    >
                                                        Изменить
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-outline-danger"
                                                        onClick={() => {
                                                            AjaxDelete({
                                                                url: `/api/quizlet/subgroups/${subgroup.id}/words/${word.id}`,
                                                            }).then(() => fetchCatalog());
                                                        }}
                                                    >
                                                        Удалить связь
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
};

export default TeacherQuizletManager;
