import React, { useEffect, useState } from "react";
import { LexisName } from "components/Activities/Lexis/Types/LexisUtils";
import Tasks, { SelectableTask } from "./Tasks";
import { LexisTaskName } from "models/Activity/ILexis";
import { DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import NewWordsModal from "./NewWordsModal";
import WordsTable from "./WordsTable";
import PageTitle from "components/Common/PageTitle";
import { AjaxPost } from "libs/ServerAPI";
import { useNavigate, useParams } from "react-router-dom";
import InputError from "components/Form/InputError";
import InputTime from "components/Form/InputTime";
import InputTextArea from "components/Form/InputTextArea";
import { TDictionaryItem, TDictionaryItemCreate } from "models/TDictionary";
import { TCreateCardItem } from "models/Activity/Items/TLexisItems";
import CreatePageLexisCard from "./CreatePageLexisCard";

interface LexisCreatePageProps {
    title: string;
    name: LexisName;
}

interface TLexisCreateResponse {
    lexis: {
        lesson_id: number;
    };
}

const getDefaultTasksArray = (): SelectableTask[] => {
    return Object.values(LexisTaskName)
        .filter((taskName) => taskName !== "card")
        .map((taskName) => ({ name: taskName, isSelected: false }));
};

const LexisCreatePage = ({ title, name }: LexisCreatePageProps) => {
    const { lessonId } = useParams();
    const navigate = useNavigate();

    const [tasks, setTasks] = useState<SelectableTask[]>(getDefaultTasksArray());
    const [isShowNewWordsModal, setIsShowNewWordsModal] = useState<boolean>(false);
    const [dictionaryWords, setDictionaryWords] = useState<TDictionaryItem[]>([]);
    const [lexisCards, setLexisCards] = useState<TCreateCardItem[]>([]);
    const [timelimit, setTimelimit] = useState<string>("00:00:00");
    const [description, setDescription] = useState<string>("");
    const [error, setError] = useState<string>("");

    useEffect(() => {
        setError("");
    }, [tasks]);

    const findIndex = (inTaskName: string): number => {
        return Object.values(tasks).findIndex(({ name }) => name === inTaskName);
    };

    const onSelectedChange = (taskName: LexisTaskName, checked: boolean) => {
        const newTasks = [...tasks];
        newTasks[findIndex(taskName)] = { name: taskName, isSelected: checked };
        setTasks(newTasks);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over === null) return;

        if (active?.data?.current?.taskName !== over?.data?.current?.taskName) {
            const activeId = findIndex(active?.data?.current?.taskName);
            const overId = findIndex(over?.data?.current?.taskName);

            setTasks(arrayMove(tasks, activeId, overId));
        }
    };

    const createHandler = () => {
        if (dictionaryWords.length < 1) {
            setError("Не добавлены слова");
            return;
        }

        const tasksToAdd = tasks
            .filter(({ isSelected }) => isSelected)
            .map(({ name }) => name)
            .join(",");
        if (tasksToAdd.length < 1) {
            setError("Не добавлены активности");
            return;
        }

        AjaxPost<TLexisCreateResponse>({
            url: `/api/${name}/${lessonId}`,
            body: {
                lexis: {
                    tasks: tasksToAdd,
                    time_limit: timelimit === "00:00:00" || timelimit === "" ? null : timelimit,
                    description,
                },
                words: lexisCards,
            },
        })
            .then((json) => {
                navigate(`/lessons/${json.lexis.lesson_id}`);
            })
            .catch(({ isServerError, response, json }) => {
                if (!isServerError) {
                    if (response.status === 404 || response.status === 403) navigate("/");
                }
            });
    };

    const createNewWords = (words: TDictionaryItemCreate[], setModalError: (message: string) => void) => {
        if (words.length < 1) {
            setModalError("Нужно добавить слова");
            return;
        }

        AjaxPost<{ words: TDictionaryItem[] }>({ url: "/api/dictionary", body: { words } })
            .then((json) => {
                setDictionaryWords(json.words);
                setLexisCards(json.words.map((item) => ({ sentence: "", answer: "", dictionary_id: item.id })));
                setIsShowNewWordsModal(false);
            })
            .catch(() => {
                setModalError("Не удалось добавить слова (ошибка сервера)");
            });
    };

    const setDictImg = (url: string | null, setDictError: () => void, id: number) => {
        AjaxPost({ url: `/api/dictionary/${dictionaryWords[id].id}/img`, body: { url: url } })
            .then(() => {
                const newDictionaryWords = [...dictionaryWords];
                newDictionaryWords[id].img = url;
                setDictionaryWords(newDictionaryWords);
            })
            .catch(() => {
                setDictError();
            });
    };

    const setCardData = (value: string, fieldName: "sentence" | "answer", id: number) => {
        const newCards = [...lexisCards];
        newCards[id] = { ...newCards[id], [fieldName]: value };
        setLexisCards(newCards);
    };

    return (
        <div className="container">
            <PageTitle title={title} />
            <input
                type="button"
                className="btn btn-primary w-100"
                onClick={() => setIsShowNewWordsModal(true)}
                value={"Импортировать слова"}
            />
            <Tasks tasks={tasks} handleDragEnd={handleDragEnd} setSelected={onSelectedChange} />
            <InputTime
                placeholder="Лимит времени"
                value={timelimit}
                onChangeHandler={setTimelimit}
                htmlId="timelimit"
            />
            <InputTextArea
                htmlId="description"
                placeholder="Описание"
                rows={5}
                onChangeHandler={setDescription}
                value={description}
            />
            {/* <WordsTable words={newWords} /> */}

            {lexisCards.map((card, i) => (
                <CreatePageLexisCard
                    key={i}
                    card={card}
                    dict={dictionaryWords[i]}
                    setDictImg={(url, setError) => setDictImg(url, setError, i)}
                    setCardData={(value, fieldName) => setCardData(value, fieldName, i)}
                />
            ))}

            <InputError message={error} className="mt-4" />
            <input type="button" className="btn btn-success w-100 mt-2" onClick={createHandler} value={"Создать"} />
            <NewWordsModal
                isShow={isShowNewWordsModal}
                close={() => setIsShowNewWordsModal(false)}
                createNewWords={createNewWords}
                colToCheck={name === "drilling" ? "word_jp" : "char_jp"}
            />
        </div>
    );
};

export default LexisCreatePage;
