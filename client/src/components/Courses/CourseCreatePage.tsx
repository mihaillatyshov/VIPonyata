import React from "react";

const CourseCreatePage = () => {
    return (
        <div className="container mt-5">
            <div className="form-floating">
                <input type="text" className="form-control" id="floatingPassword" placeholder="Название" />
                <label htmlFor="floatingPassword">Название</label>
            </div>
        </div>
    );
};

export default CourseCreatePage;
