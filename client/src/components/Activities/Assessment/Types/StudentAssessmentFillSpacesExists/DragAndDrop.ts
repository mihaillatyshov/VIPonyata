export type FieldName = "answers" | "inputs";

export type SingleSwapDataProps = { id: number; name: FieldName };

export type SwapDataProps = {
    from: SingleSwapDataProps;
    to: SingleSwapDataProps;
};

type DropCallbackType = (swapData: SwapDataProps) => void;

export type FieldProps = {
    accept: string;
    onDropCallback: DropCallbackType;
};
