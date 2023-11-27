import React from "react";

import { LexisProcessingPage } from "components/Activities/Lexis/ProcessingPage";

export const DrillingEditPage = () => {
    return <LexisProcessingPage title="ごい" name="drilling" processingType="edit" />;
};

export const DrillingCreatePage = () => {
    return <LexisProcessingPage title="ごい" name="drilling" processingType="create" />;
};
