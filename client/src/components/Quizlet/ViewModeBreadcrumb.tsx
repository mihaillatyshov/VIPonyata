import "./ViewModeBreadcrumb.css";

export interface ViewModeBreadcrumbItem {
    key: string;
    label: string;
    onClick?: () => void;
}

interface ViewModeBreadcrumbProps {
    items: ViewModeBreadcrumbItem[];
    className?: string;
}

const ViewModeBreadcrumb = ({ items, className = "" }: ViewModeBreadcrumbProps) => {
    if (items.length === 0) {
        return null;
    }

    return (
        <nav aria-label="Breadcrumb" className={`quizlet-view-breadcrumb ${className}`.trim()}>
            <ol className="quizlet-view-breadcrumb__list">
                {items.map((item, index) => {
                    const isCurrent = index === items.length - 1;

                    return (
                        <li key={item.key} className="d-flex align-items-center gap-2">
                            {!isCurrent && item.onClick ? (
                                <button type="button" className="quizlet-view-breadcrumb__link" onClick={item.onClick}>
                                    {item.label}
                                </button>
                            ) : (
                                <span className="quizlet-view-breadcrumb__current">{item.label}</span>
                            )}
                            {!isCurrent && <span className="quizlet-view-breadcrumb__separator">&gt;</span>}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
};

export default ViewModeBreadcrumb;
