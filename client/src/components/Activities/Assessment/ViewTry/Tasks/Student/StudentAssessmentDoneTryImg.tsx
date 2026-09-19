import { AssessmentImgContent } from "components/Activities/Assessment/AssessmentImgContent";
import { TAssessmentCheckedImg, TAssessmentImg } from "models/Activity/Items/TAssessmentItems";

import { AssessmentDoneTryTaskBaseProps } from "../AssessmentDoneTryTaskBase";

export const StudentAssessmentDoneTryImg = ({
    data,
}: AssessmentDoneTryTaskBaseProps<TAssessmentImg, TAssessmentCheckedImg>) => {
    return <AssessmentImgContent data={data} descriptionClassName="prevent-select md-last-pad-zero" />;
};
