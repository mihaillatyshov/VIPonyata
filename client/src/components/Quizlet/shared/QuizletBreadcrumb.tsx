import { ReactNode } from "react";
import { Link } from "react-router-dom";

export interface QuizletBreadcrumbItem {
    key: string | number;
    label: ReactNode;
    /** Ссылка; без неё элемент выводится текстом. */
    to?: string;
    active?: boolean;
}

interface QuizletBreadcrumbProps {
    items: QuizletBreadcrumbItem[];
    className?: string;
}

const QuizletBreadcrumb = ({
    items,
    className = "quizlet-teacher-breadcrumb quizlet-student-view-breadcrumb",
}: QuizletBreadcrumbProps) => (
    <nav aria-label="breadcrumb" className={className}>
        <ol className="breadcrumb mb-0">
            {items.map((item) => (
                <li
                    key={item.key}
                    className={`breadcrumb-item${item.active ? " active" : ""}`}
                    aria-current={item.active ? "page" : undefined}
                >
                    {item.to !== undefined ? <Link to={item.to}>{item.label}</Link> : item.label}
                </li>
            ))}
        </ol>
    </nav>
);

export default QuizletBreadcrumb;
