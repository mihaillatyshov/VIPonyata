import ActivityBubble from "./ActivityBubble";

interface LoadingBubbleProps {
    title: string;
}

const LoadingBubble = ({ title }: LoadingBubbleProps) => {
    return (
        <ActivityBubble title={title}>
            <div className="placeholder-wave">
                <span className="placeholder bg-placeholder me-3 rounded" style={{ width: "80px" }}></span>
                <span className="placeholder bg-placeholder me-3 rounded" style={{ width: "40px" }}></span>
                <span className="placeholder bg-placeholder me-3 rounded" style={{ width: "60px" }}></span>
                <span className="placeholder bg-placeholder me-3 rounded" style={{ width: "80px" }}></span>
                <span className="placeholder bg-placeholder me-3 rounded" style={{ width: "60px" }}></span>
                <span className="placeholder bg-placeholder me-3 rounded" style={{ width: "60px" }}></span>
            </div>
        </ActivityBubble>
    );
};

export default LoadingBubble;
