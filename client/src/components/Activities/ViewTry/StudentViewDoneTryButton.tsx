import React, { useState } from "react";

import { ActivityName } from "models/Activity/IActivity";

import StudentViewDoneTryModal from "./StudentViewDoneTryModal";

interface StudentViewTryButtonProps {
    id: number;
    name: ActivityName;
}

const StudentViewTryButton = ({ id, name }: StudentViewTryButtonProps) => {
    const [isModalShow, setIsModalShow] = useState<boolean>(false);

    return (
        <>
            <input
                type="button"
                value="Результаты"
                className="btn btn-secondary"
                onClick={() => setIsModalShow(true)}
            />
            <StudentViewDoneTryModal isShow={isModalShow} close={() => setIsModalShow(false)} id={id} name={name} />
        </>
    );
};

export default StudentViewTryButton;
