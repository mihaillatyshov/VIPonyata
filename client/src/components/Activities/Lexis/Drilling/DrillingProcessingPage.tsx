import React from "react";

import { LexisProcessingPage } from "components/Activities/Lexis/ProcessingPage";

export const DrillingEditPage = () => {
    return <LexisProcessingPage title="Лексика" name="drilling" processingType="edit" />;
};

export const DrillingCreatePage = () => {
    return <LexisProcessingPage title="Лексика" name="drilling" processingType="create" />;
};
