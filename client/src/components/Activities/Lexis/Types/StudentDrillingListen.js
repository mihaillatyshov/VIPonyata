import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setDrillingSelectedItem, setDrillingSelectedItemField } from "redux/slices/drillingSlice";

const StudentDrillingListen = ({ words }) => {
    const dispatch = useDispatch();
    const item = useSelector((state) => state.drilling.selectedItem);
    const taskTypeName = "drillingfindpair";
    const strWordsRU = "WordsRU";
    const strWordsJP = "WordsJP";

    useEffect(() => {
        console.log("setDrillingSelectedItem Listen");
        if (pairs) {
            console.log(pairs);
            dispatch(
                setDrillingSelectedItem({
                    ...pairs,
                    type: taskTypeName,
                    selectedField: { id: -1, type: "None" },
                    doneFields: [],
                })
            );
        }
    }, []);

    const checkItem = () => {
        if (item) {
            if (item.type === taskTypeName) {
                return true;
            }
        }
        return false;
    };

    return (
        <div>
            {checkItem() ? (
                <div className="container">
                    <div className="row">
                        <div className="col-6">
                            <div className="container">
                                <div className="row justify-content-end">
                                    {item.WordsJP.map((value, key) => (
                                        <Card
                                            className={getCardClassName(key, strWordsJP)}
                                            key={key}
                                            onClick={() => selectField(key, strWordsJP)}
                                        >
                                            {value}
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="col-6">
                            <div className="container">
                                <div className="row">
                                    {item.WordsRU.map((value, key) => (
                                        <Card
                                            className={getCardClassName(key, strWordsRU)}
                                            key={key}
                                            onClick={() => selectField(key, strWordsRU)}
                                        >
                                            {value}
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div> </div>
            )}
            <div>StudentDrillingFindPair</div>
        </div>
    );
};

export default StudentDrillingListen;
