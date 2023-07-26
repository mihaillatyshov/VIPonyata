type TitleProps = { title: string };
export const Title = ({ title }: TitleProps) => {
    return <div> {title} </div>;
};

type DescriptionProps = { description: string | null };
export const Description = ({ description }: DescriptionProps) => {
    return <div> {description ?? ""} </div>;
};

export const TitlePlaceholder = () => {
    return (
        <div className="placeholder-wave ">
            <span className="placeholder w-25 bg-secondary rounded"></span>
        </div>
    );
};

export const DescriptionPlaceholder = () => {
    return (
        <div className="placeholder-wave">
            <span className="placeholder bg-secondary me-3 rounded" style={{ width: "40px" }}></span>
            <span className="placeholder bg-secondary me-3 rounded" style={{ width: "60px" }}></span>
            <span className="placeholder bg-secondary me-3 rounded" style={{ width: "40px" }}></span>
            <span className="placeholder bg-secondary me-3 rounded" style={{ width: "60px" }}></span>
            <span className="placeholder bg-secondary me-3 rounded" style={{ width: "40px" }}></span>
            <span className="placeholder bg-secondary me-3 rounded" style={{ width: "40px" }}></span>
        </div>
    );
};
