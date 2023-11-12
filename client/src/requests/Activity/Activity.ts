import { AjaxGet, isProcessableError } from "libs/ServerAPI";
import { LoadStatus } from "libs/Status";
import { ActivityName } from "models/Activity/IActivity";
import { IActivityDoneTry } from "models/Activity/Try/IActivityTry";

export type GetActivityDoneTriesDataType = LoadStatus.DataDoneOrNotDone<{ data: IActivityDoneTry[] }>;

interface GetActivityDoneTriesProps {
    id: number;
    name: ActivityName;
    setDoneTries: (tries: GetActivityDoneTriesDataType) => void;
    setError: (error: string) => void;
}

interface GetActivityDoneTriesError {
    message: string;
}

export const requestGetActivityDoneTries = ({ id, name, setDoneTries, setError }: GetActivityDoneTriesProps) => {
    setDoneTries({ loadStatus: LoadStatus.LOADING });
    AjaxGet<{ done_tries: IActivityDoneTry[] }>({ url: `/api/${name}/${id}/donetries` })
        .then((json) => {
            setDoneTries({ loadStatus: LoadStatus.DONE, data: json.done_tries });
        })
        .catch((error) => {
            setError(isProcessableError<GetActivityDoneTriesError>(error) ? error.json.message : "Ошибка сервера");
            setDoneTries({ loadStatus: LoadStatus.ERROR });
        });
};
