export interface InputBaseProps {
    htmlId: string;
    placeholder: string;
    value: string;
    className?: string;
    onChangeHandler: (value: string) => void;
}
