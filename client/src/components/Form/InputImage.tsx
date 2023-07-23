import React from "react";

export interface InputImageProps {
    htmlId: string;
    placeholder: string;
    value?: string;
    className?: string;
    onChangeHandler: (value: string | undefined) => void;
}

const InputImage = ({ htmlId, placeholder, value, className, onChangeHandler }: InputImageProps) => {
    const handler = (e: React.ChangeEvent<HTMLInputElement>) => {
        console.log(e.target.value, e.target.files);
        if (e.target.files && e.target.files.length > 0) {
            const data = new FormData();
            data.append("file", e.target.files[0]);
            fetch("/api/upload/img", {
                method: "POST",
                body: data,
            }).then((response) => {
                const promise = response.json();
                promise.then((body) => {
                    console.log("Loading Done!!!");
                    console.log("Post response", body);
                    onChangeHandler(body.filename);
                });
            });
        }
    };

    const hasValue = value !== undefined;

    return (
        <div>
            <label htmlFor={htmlId} className="form-label">
                {hasValue ? <img src={value} alt={placeholder}></img> : "Default file input example"}
            </label>
            <input
                className={hasValue ? "d-none" : "form-control"}
                type="file"
                id={htmlId}
                accept="image/*"
                onChange={handler}
            />
        </div>
    );
};

export default InputImage;
