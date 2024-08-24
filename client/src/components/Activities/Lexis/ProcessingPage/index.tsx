import React, { useEffect, useLayoutEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Loading from "components/Common/Loading";
import PageTitle from "components/Common/PageTitle";
import ErrorPage from "components/ErrorPages/ErrorPage";
import { FloatingLabelTextareaAutosize } from "components/Form/FloatingLabelTextareaAutosize";
import InputError from "components/Form/InputError";
import InputTime from "components/Form/InputTime";
import { AjaxDelete, AjaxPatch, AjaxPost } from "libs/ServerAPI";
import { LoadStatus } from "libs/Status";
import { LexisName } from "models/Activity/IActivity";
import { LexisTaskName } from "models/Activity/ILexis";
import { TCreateCardItem } from "models/Activity/Items/TLexisItems";
import { TProcessingType } from "models/Processing";
import { TDictionaryItem, TDictionaryItemCreate } from "models/TDictionary";
import { ProcessingButtonBlock } from "ui/Processing/ProcessingButtonBlock";

import { DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";

import { pickLexisWordOrChar } from "../Types/LexisUtils";
import { LexisProcessingCard } from "./LexisProcessingCard";
import { getModalDefaultText, getProcessingData, SelectableTask } from "./LexisProcessingUtils";
import NewWordsModal from "./NewWordsModal";
import Tasks from "./Tasks";

interface TLexisProcessingResponse {
    lexis: {
        lesson_id: number;
    };
}

interface LexisProcessingPageProps {
    title: string;
    name: LexisName;
    processingType: TProcessingType;
}

export const LexisProcessingPage = ({ title, name, processingType }: LexisProcessingPageProps) => {
    const { id: idStr } = useParams();
    const id = parseInt(idStr as string);

    const navigate = useNavigate();

    const [loadStatus, setLoadStatus] = useState<LoadStatus.Type>(LoadStatus.NONE);
    const [error, setError] = useState<string>("");

    const [isShowNewWordsModal, setIsShowNewWordsModal] = useState<boolean>(false);

    const [tasks, setTasks] = useState<SelectableTask[]>([]);
    const [dictionaryWords, setDictionaryWords] = useState<TDictionaryItem[]>([]);
    const [lexisCards, setLexisCards] = useState<TCreateCardItem[]>([]);
    const [timelimit, setTimelimit] = useState<string>("00:00:00");
    const [description, setDescription] = useState<string>("");
    const [lessonId, setLessonId] = useState<number>(0);

    useEffect(() => {
        setError("");
    }, [tasks]);

    useLayoutEffect(() => {
        setLoadStatus(LoadStatus.LOADING);

        getProcessingData(processingType, name, id).then((data) => {
            if (data.loadStatus === LoadStatus.ERROR) {
                setError(data.message);
                setLoadStatus(LoadStatus.ERROR);
                if (data.needExitPage) {
                    navigate("/");
                }
                return;
            }

            setLoadStatus(LoadStatus.DONE);
            setTasks(data.tasks);
            setDictionaryWords(data.dictionaryWords);
            setLexisCards(data.lexisCards);
            setTimelimit(data.timelimit);
            setDescription(data.description);
            setLessonId(data.lessonId);
        });
    }, [id, name, processingType, navigate]);

    if (loadStatus === LoadStatus.ERROR) {
        return (
            <ErrorPage
                errorImg="/svg/SomethingWrong.svg"
                textMain={error}
                textDisabled="Попробуйте перезагрузить страницу"
            />
        );
    }

    if (loadStatus !== LoadStatus.DONE) {
        return (
            <div className="container d-flex flex-column justify-content-center align-items-center">
                <PageTitle title={title} />
                <Loading size="xxl" />
            </div>
        );
    }

    const handleDelete = () => {
        AjaxDelete({ url: `/api/${name}/${id}` }).then(() => {
            navigate(`/lessons/${lessonId}`);
        });
    };

    const handleProcessing = () => {
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

        const ajaxMethod = processingType === "edit" ? AjaxPatch : AjaxPost;

        ajaxMethod<TLexisProcessingResponse>({
            url: `/api/${name}/${id}`,
            body: {
                lexis: {
                    tasks: tasksToAdd,
                    time_limit: timelimit === "00:00:00" || timelimit === "" ? null : timelimit,
                    description,
                },
                cards: lexisCards,
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

    const findIndex = (inTaskName: string): number => {
        return Object.values(tasks).findIndex(({ name }) => name === inTaskName);
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

    const onSelectedChange = (taskName: LexisTaskName, checked: boolean) => {
        const newTasks = [...tasks];
        newTasks[findIndex(taskName)] = { name: taskName, isSelected: checked };
        setTasks(newTasks);
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
            .catch(() => setDictError());
    };

    const setCardData = (value: string, fieldName: "sentence" | "answer", id: number) => {
        const newCards = [...lexisCards];
        newCards[id] = { ...newCards[id], [fieldName]: value };
        setLexisCards(newCards);
    };

    return (
        <div className="container mb-5 pb-5">
            <PageTitle title={title} urlBack={`/lessons/${lessonId}`} />
            <div className="processing-page">
                <div className="processing-page__header">
                    <input
                        type="button"
                        className="btn btn-violet w-100"
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
                    <FloatingLabelTextareaAutosize
                        htmlId="description"
                        placeholder="Описание"
                        rows={6}
                        onChangeHandler={setDescription}
                        value={description}
                    />
                </div>
                <div className="processing-page__content">
                    {lexisCards.map((card, i) => (
                        <LexisProcessingCard
                            key={i}
                            card={card}
                            dict={dictionaryWords[i]}
                            setDictImg={(url, setError) => setDictImg(url, setError, i)}
                            setCardData={(value, fieldName) => setCardData(value, fieldName, i)}
                        />
                    ))}
                </div>
                <div>
                    <ProcessingButtonBlock
                        onSubmit={handleProcessing}
                        onDelete={handleDelete}
                        processingType={processingType}
                    />
                    <InputError message={error} />
                </div>
                <NewWordsModal
                    isShow={isShowNewWordsModal}
                    close={() => setIsShowNewWordsModal(false)}
                    createNewWords={createNewWords}
                    colToCheck={pickLexisWordOrChar(name)}
                    defaultText={getModalDefaultText(dictionaryWords)}
                    defaultPreview={dictionaryWords}
                />
            </div>
        </div>
    );
};
