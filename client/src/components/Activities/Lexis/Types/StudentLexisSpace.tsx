import React from "react";
import { Button } from "react-bootstrap";
import StudentLexisTaskInterface from "./StudentLexisTaskInterface";
import { StudentLexisTaskProps, useLexisItem, useSetLexisSelectedItemField } from "./LexisUtils";
import { TSpace } from "models/Activity/Items/TLexisItems";

const StudentLexisSpace = ({ name, inData, goToNextTaskCallback }: StudentLexisTaskProps<TSpace>) => {
    const item = useLexisItem(name);
    const setLexisSelectedItemField = useSetLexisSelectedItemField(name);

    console.log("Space", inData);

    const getWordData = (id: number) => {
        console.log(
            id,
            inData.words[id % inData.words.length].word_start,
            inData.words[id % inData.words.length].word_end
        );
        return {
            inputText: "",
            wordId: id,
            wordStart: inData.words[id % inData.words.length].word_start,
            wordEnd: inData.words[id % inData.words.length].word_end,
        };
    };

    const nextWord = () => {
        const fullInput = item.wordStart + item.inputText.trim() + item.wordEnd;
        console.log(inData.words[item.wordId], fullInput);
        if (inData.words[item.wordId].word_or_char_jp === fullInput) {
            setLexisSelectedItemField({ ...getWordData(item.wordId + 1) });
        }
    };

    return (
        <StudentLexisTaskInterface
            name={name}
            taskTypeName="space"
            newObjectData={{
                ...getWordData(0),
            }}
            goToNextTaskCallback={goToNextTaskCallback}
            isTaskDone={() => {
                return inData.words.length === item.wordId;
            }}
            maincontent={() => {
                return (
                    <div>
                        <div className="input-group my-3">
                            <div className="input-group-prepend">
                                <span className="input-group-text" id="inputGroup-sizing-default">
                                    {item.wordStart === "" ? "⠀" : item.wordStart}
                                </span>
                            </div>
                            <input
                                type="text"
                                className="form-control"
                                aria-label="Default"
                                aria-describedby="inputGroup-sizing-default"
                                value={item.inputText}
                                onChange={(e) => setLexisSelectedItemField({ inputText: e.target.value })}
                            />
                            <div className="input-group-append">
                                <span className="input-group-text" id="inputGroup-sizing-default">
                                    {item.wordEnd === "" ? "⠀" : item.wordEnd}
                                </span>
                            </div>
                        </div>

                        <Button onClick={nextWord}> Next </Button>
                    </div>
                );
            }}
        />
    );
};

export default StudentLexisSpace;
