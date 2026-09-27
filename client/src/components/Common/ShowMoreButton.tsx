interface ShowMoreButtonProps {
    hasMore: boolean;
    isLoading: boolean;
    isError?: boolean;
    onClick: () => void;
    className?: string;
}

const ShowMoreButton = ({ hasMore, isLoading, isError = false, onClick, className }: ShowMoreButtonProps) => {
    if (!hasMore) {
        return null;
    }

    return (
        <div className={className ?? "d-flex flex-column align-items-center gap-2 mt-2"}>
            {isError && <div className="text-danger small">Не удалось загрузить. Попробуйте ещё раз.</div>}
            <button type="button" className="btn btn-outline-secondary" onClick={onClick} disabled={isLoading}>
                {isLoading ? "Загрузка…" : "Показать ещё"}
            </button>
        </div>
    );
};

export default ShowMoreButton;
