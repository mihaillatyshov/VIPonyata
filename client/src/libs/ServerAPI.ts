interface HandleStatusData {
    isOk: boolean;
    status: number;
    data: any | undefined;
}

interface AnyServerAPIParams {
    url: string;
    urlParams?: Object | undefined;
    body?: any | undefined;
    onDataReceived?: ((data: any) => void) | undefined;
    handleStatus?: ((data: HandleStatusData) => void) | undefined;
    handleServerError?: (() => void) | undefined;
    headers?: HeadersInit | undefined;
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

type ServerError = {
    isServerError: boolean;
    message: string;
};
const Ajax = async <T>({ method, url, urlParams, body, headers }: ServerAPIParams): Promise<T> => {
    let response;
    try {
        response = await fetch(url + getStrFromParams(urlParams), {
            method: method,
            mode: "cors",
            //credentials: credentials ? "include" : undefined,
            body: body && JSON.stringify(body),
            headers: { "Content-Type": "application/json; charset=UTF-8" },
        });
    } catch (e) {
        const error: ServerError = { isServerError: true, message: "Server Error!" };
        throw error;
    }

    let json;
    try {
        json = await response.json();
    } catch {
        const error: ServerError = { isServerError: true, message: "JSON Error!" };
        throw error;
    }

    if (response.ok) {
        return json;
    }

    const error = { isServerError: false, json: json, response: response };
    throw error;
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
