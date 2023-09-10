export type PyErrorType = "value_error";

export interface PyError {
    loc: string[];
    msg: string;
    type: PyErrorType;
}

export interface PyErrorResponse {
    [key: string]: PyError[];
}
