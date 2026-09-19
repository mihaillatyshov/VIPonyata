import { AssessmentImgContent } from "components/Activities/Assessment/AssessmentImgContent";
import { TAssessmentImg } from "models/Activity/Items/TAssessmentItems";

import { StudentAssessmentTypeProps } from "./StudentAssessmentTypeProps";

const StudentAssessmentImg = ({ data }: StudentAssessmentTypeProps<TAssessmentImg>) => {
    return <AssessmentImgContent data={data} descriptionClassName="prevent-select md-last-pad-zero" />;
};

export default StudentAssessmentImg;
