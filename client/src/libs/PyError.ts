export type PyErrorType = "value_error";

export interface PyError {
    message: string;
    type: PyErrorType;
}

export interface PyErrorDict {
    errors: {
        [key: string]: PyError;
    };
    message: string;
}

const valueErrorPrefix = "Value error,";

export const fixPyErrorMessage = (message: string): string => {
    message = message.trim();
    if (message === "Field required") message = "Нужно заполнить поле";

    if (message.startsWith(valueErrorPrefix)) message = message.slice(valueErrorPrefix.length);

    return message.trim();
};
