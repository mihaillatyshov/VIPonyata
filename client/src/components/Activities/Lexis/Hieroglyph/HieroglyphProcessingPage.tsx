import React from "react";

import { LexisProcessingPage } from "components/Activities/Lexis/ProcessingPage";

export const HieroglyphEditPage = () => {
    return <LexisProcessingPage title="かんじ" name="hieroglyph" processingType="edit" />;
};

export const HieroglyphCreatePage = () => {
    return <LexisProcessingPage title="かんじ" name="hieroglyph" processingType="create" />;
};
