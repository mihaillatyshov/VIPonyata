import { ActivityName } from "components/Activities/ActivityUtils";
import { AjaxGet, isProcessableError } from "libs/ServerAPI";
import { LoadStatus } from "libs/Status";
import { ActivityDoneTry } from "models/Activity/Try/ActivityDoneTry";

export type GetActivityDoneTriesDataType = LoadStatus.DataDoneOrNotDone<{ data: ActivityDoneTry[] }>;

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
    AjaxGet<{ done_tries: ActivityDoneTry[] }>({ url: `/api/${name}/${id}/donetries` })
        .then((json) => {
            setDoneTries({ loadStatus: LoadStatus.DONE, data: json.done_tries });
        })
        .catch((error) => {
            setError(isProcessableError<GetActivityDoneTriesError>(error) ? error.json.message : "Ошибка сервера");
            setDoneTries({ loadStatus: LoadStatus.ERROR });
        });
};
