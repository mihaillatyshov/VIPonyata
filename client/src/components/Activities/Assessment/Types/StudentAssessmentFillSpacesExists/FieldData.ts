export type DraggableType = "answer" | "inputs";

export interface FieldData {
    fieldId: number;
    type: DraggableType;
}

export const isFieldData = (data: any): data is FieldData => data !== undefined;
