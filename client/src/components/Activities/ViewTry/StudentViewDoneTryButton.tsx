import { useRef, useState } from "react";

import { ActivityName } from "models/Activity/IActivity";

import StudentViewDoneTryModal from "./StudentViewDoneTryModal";

interface StudentViewTryButtonProps {
    id: number;
    name: ActivityName;
}

const StudentViewTryButton = ({ id, name }: StudentViewTryButtonProps) => {
    const [isModalShow, setIsModalShow] = useState<boolean>(false);
    const buttonRef = useRef<HTMLInputElement>(null);

    const openModal = () => {
        setIsModalShow(true);
        buttonRef.current?.blur();
    };

    return (
        <>
            <input
                ref={buttonRef}
                type="button"
                value="Результаты"
                className="btn btn-secondary student-assessment-back-btn"
                onClick={openModal}
            />
            <StudentViewDoneTryModal isShow={isModalShow} close={() => setIsModalShow(false)} id={id} name={name} />
        </>
    );
};

export default StudentViewTryButton;
