import { useMemo } from "react";

import { TReviewWord, TReviewWordStatus } from "models/TReview";

import { createEmptyStageSummary } from "./reviewTraining";

const STATUS_CARDS: Array<{ status: TReviewWordStatus; label: string }> = [
    { status: "shaky", label: "🔴 shaky" },
    { status: "passive", label: "🟡 passive" },
    { status: "active", label: "🟢 active" },
];

const STAGE_ICONS = { 1: "◔", 2: "◑", 3: "◕" } as const;

/** Сколько слов в каждом статусе запоминания и на каждой стадии; замороженные — отдельно. */
const ReviewStatusesPanel = ({ words }: { words: TReviewWord[] }) => {
    const summary = useMemo(
        () =>
            words.reduce(
                (result, word) => {
                    if (word.is_frozen) {
                        result.frozen += 1;
                        return result;
                    }

                    result[word.status] += 1;
                    result.stages[word.status][word.stage] += 1;
                    return result;
                },
                {
                    shaky: 0,
                    passive: 0,
                    active: 0,
                    frozen: 0,
                    stages: {
                        shaky: createEmptyStageSummary(),
                        passive: createEmptyStageSummary(),
                        active: createEmptyStageSummary(),
                    },
                },
            ),
        [words],
    );

    return (
        <section className="review-training-panel">
            <div className="review-status-grid">
                {STATUS_CARDS.map(({ status, label }) => (
                    <div key={status} className={`review-status-card ${status}`}>
                        <span className="review-status-card-label">{label}</span>
                        <span className="review-status-card-value">{summary[status]}</span>
                        <div className="review-status-card-stages">
                            {([1, 2, 3] as const).map((stage) => (
                                <span key={stage} className="review-status-card-stage-pill">
                                    {STAGE_ICONS[stage]} {summary.stages[status][stage]}
                                </span>
                            ))}
                        </div>
                    </div>
                ))}
                <div className="review-status-card frozen">
                    <span className="review-status-card-label">❄️ frozen</span>
                    <span className="review-status-card-value">{summary.frozen}</span>
                    <div className="review-status-card-note">Скрыты из smart review</div>
                </div>
            </div>
        </section>
    );
};

export default ReviewStatusesPanel;
