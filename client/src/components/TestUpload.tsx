import React, { useEffect, useState } from "react";
import { AjaxGet } from "libs/ServerAPI";
import { Link } from "react-router-dom";

const TestUpload = () => {
    const [imageURL, setImageURL] = useState("");
    let filepath: File | undefined = undefined;

    useEffect(() => {
        console.log("test data");
        AjaxGet<any>({ url: "/test" }).then((json) => {
            console.log(json);
        });
    }, []);

    const handleUploadImage = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        console.log("startHandle");
        console.log(filepath);

        if (filepath === undefined) return;

        let data = new FormData();
        data.append("file", filepath);
        //data.set("test_name", "my test message");
        console.log("Data to server(FormData): ", data);

        fetch("/api/upload", {
            method: "POST",
            body: data,
        }).then((response) => {
            // const promise = response.json();
            // promise.then((body) => {
            //     setImageURL(body.meta.filename);
            //     console.log("Post response", body);
            // });
        });

        console.log("endHandle");
    };

    const handleFilepathChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files) {
            console.log(e.target.files[0]);
            filepath = e.target.files[0];
        }
    };

    // ref={(ref) => { filepath = ref; console.log("Test ", ref)}}
    return (
        <form onSubmit={handleUploadImage}>
            <div>
                <input type="file" onChange={handleFilepathChange} />
            </div>
            <br />
            <div>
                <input type="submit" value="Upload" />
            </div>
            <img src={imageURL} alt="img" />
            <br />
            <img src={"/img/38UNp4Gt-d8.jpg"} alt="img" />

            <Link to="/"> Main </Link>
        </form>
    );
};

export default TestUpload;
