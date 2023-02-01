import React from "react";

const TestDragAndDrop = () => {
    const dragStartHandle = (e: any) => {};
    const dragLeaveHandle = (e: any) => {};
    const dragEndHandle = (e: any) => {};
    const dragOverHandle = (e: any) => {
        e.prevenDefault();
    };
    const dropHandle = (e: any) => {
        e.prevenDefault();
    };

    return (
        <div className="mt-4">
            <div
                className="draggable"
                onDragStart={(e) => dragStartHandle(e)}
                onDragLeave={(e) => dragLeaveHandle(e)}
                onDragEnd={(e) => dragEndHandle(e)}
                onDragOver={(e) => dragOverHandle(e)}
                onDrop={(e) => dropHandle(e)}
                draggable={true}
            >
                TestDragAndDrop
            </div>
        </div>
    );
};

export default TestDragAndDrop;
