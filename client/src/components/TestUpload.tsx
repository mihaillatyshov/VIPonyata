import { AjaxGet } from "libs/ServerAPI";
import React, { useEffect, useState } from "react";
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

    const handleUploadImage = () => {
        //e.preventDefault();
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
            const promise = response.json();
            promise.then((body) => {
                setImageURL(body.meta.filename);
                console.log("Post response", body);
            });
        });

        console.log("endHandle");
    };

    const handleFilepathChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            console.log(e.target.files[0]);
            filepath = e.target.files[0];
        }
    };

    // ref={(ref) => { filepath = ref; console.log("Test ", ref)}}
    return (
        <div>
            <div>
                <input type="file" onChange={handleFilepathChange} />
            </div>
            <br />
            <div>
                <input type="button" onClick={handleUploadImage} value="Upload" />
            </div>
            <img src={imageURL} alt="img" />
            <br />
            <img src={"/img/38UNp4Gt-d8.jpg"} alt="img" />

            <Link to="/"> Main </Link>
        </div>
    );
};

export default TestUpload;
