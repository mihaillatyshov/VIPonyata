interface HandleStatusData {
    isOk: boolean;
    status: number;
    data: any;
}

interface AnyServerAPIParams {
    url: string;
    urlParams?: Object;
    body?: any;
    onDataReceived?: (data: any) => void;
    handleStatus?: (data: HandleStatusData) => void;
    handleServerError?: () => void;
    headers?: HeadersInit;
}

const DefaultServerAPIParams: AnyServerAPIParams = {
    url: "/",
    urlParams: undefined,
    body: undefined,
    onDataReceived: undefined,
    handleStatus: undefined,
    headers: undefined,
};

interface ServerAPIParams extends AnyServerAPIParams {
    method: string;
}

const getStrFromParams = (rawParams: Object | undefined) => {
    return rawParams
        ? "?" +
              Object.entries(rawParams)
                  .map((item) => {
                      return `${item[0]}=${item[1]}`;
                  })
                  .join("&")
        : "";
};

interface ServerErrorCheck {
    response?: Response;
}

interface ServerError {
    isServerError: boolean;
    message: string;
    response: Response;
}

export interface ProcessableServerError<T> {
    isServerError: false;
    json: T;
    response: Response;
}

const isErrorHasResponse = (e: any): e is ServerErrorCheck => e.response !== undefined;

export const isProcessableError = <T>(e: any): e is ProcessableServerError<T> => {
    return e.isServerError !== undefined && e.isServerError === false;
};

const Ajax = async <T>({ method, url, urlParams, body, headers }: ServerAPIParams): Promise<T> => {
    try {
        const response = await fetch(url + getStrFromParams(urlParams), {
            method: method,
            mode: "cors",
            //credentials: credentials ? "include" : undefined,
            body: body && JSON.stringify(body),
            headers: { "Content-Type": "application/json; charset=UTF-8" },
        });
        try {
            const json = await response.json();
            if (response.ok) {
                return json;
            }

            const error = { isServerError: false, json: json, response: response };
            throw error;
        } catch (e: unknown) {
            if (isErrorHasResponse(e)) {
                throw e;
            }
            const error: ServerError = { isServerError: true, message: "JSON Error!", response: response };
            throw error;
        }
    } catch (e: unknown) {
        if (isErrorHasResponse(e)) {
            throw e;
        }

        const error: ServerError = {
            isServerError: true,
            message: "Server Error!",
            response: new Response(undefined, { status: 500 }),
        };
        throw error;
    }
};

export const AjaxGet = <T>(params = DefaultServerAPIParams) => {
    return Ajax<T>({ ...params, method: "GET" });
};

export const AjaxPost = <T>(params = DefaultServerAPIParams) => {
    return Ajax<T>({ ...params, method: "POST" });
};

export const AjaxPatch = <T>(params = DefaultServerAPIParams) => {
    return Ajax<T>({ ...params, method: "PATCH" });
};

export const AjaxDelete = <T>(params = DefaultServerAPIParams) => {
    return Ajax<T>({ ...params, method: "DELETE" });
};
