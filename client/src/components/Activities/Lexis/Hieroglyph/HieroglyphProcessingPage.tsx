import React from "react";

import { LexisProcessingPage } from "components/Activities/Lexis/ProcessingPage";

export const HieroglyphEditPage = () => {
    return <LexisProcessingPage title="Иероглифы" name="hieroglyph" processingType="edit" />;
};

export const HieroglyphCreatePage = () => {
    return <LexisProcessingPage title="Иероглифы" name="hieroglyph" processingType="create" />;
};
