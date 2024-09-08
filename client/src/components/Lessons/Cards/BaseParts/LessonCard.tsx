import ReactMarkdown from "react-markdown";

import { ChatUrlLinkMd, TextWithLinksForMd } from "components/Common/TextWithLinks";

type TitleProps = { title: string };
export const Title = ({ title }: TitleProps) => {
    return <div className="lesson__card-title"> {title} </div>;
};

type DescriptionProps = { description: string | null };
export const Description = ({ description }: DescriptionProps) => {
    return (
        <div className="md-last-pad-zero">
            <ReactMarkdown components={{ a: ChatUrlLinkMd }}>
                {TextWithLinksForMd({ text: description ?? "", linkMaxChars: 40 })}
            </ReactMarkdown>
        </div>
    );
};

export const TitlePlaceholder = () => {
    return (
        <div className="placeholder-wave ">
            <span className="placeholder w-25 bg-placeholder rounded"></span>
        </div>
    );
};

export const DescriptionPlaceholder = () => {
    return (
        <div className="placeholder-wave">
            <span className="placeholder bg-placeholder me-3 rounded" style={{ width: "40px" }}></span>
            <span className="placeholder bg-placeholder me-3 rounded" style={{ width: "60px" }}></span>
            <span className="placeholder bg-placeholder me-3 rounded" style={{ width: "40px" }}></span>
            <span className="placeholder bg-placeholder me-3 rounded" style={{ width: "60px" }}></span>
            <span className="placeholder bg-placeholder me-3 rounded" style={{ width: "40px" }}></span>
            <span className="placeholder bg-placeholder me-3 rounded" style={{ width: "40px" }}></span>
        </div>
    );
};
