export type FieldName = "answers" | "inputs";

export type SingleSwapDataProps = { id: number; colId: number; name: FieldName };

export type SwapDataProps = {
    from: SingleSwapDataProps;
    to: SingleSwapDataProps;
};

type DropCallbackType = (swapData: SwapDataProps) => void;

export interface FieldProps {
    accept: string;
    onDropCallback: DropCallbackType;
}
