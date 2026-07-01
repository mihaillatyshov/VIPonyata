import {
    TAssessmentCheckedItems,
    TStudentAssessmentItems,
    TTeacherAssessmentAnyItem,
} from "models/Activity/Items/TAssessmentItems";

export interface TTaskBankItem {
    id: number;
    title: string;
    sort: number;
    task_name: string;
    task: TTeacherAssessmentAnyItem;
    is_hidden?: boolean;
    lesson_id: number | null;
    source_assessment_id: number | null;
    source_task_index: number | null;
    source_block_index?: number | null;
    completion_count?: number;
    created_at: string;
    updated_at: string;
}

export interface THomeworkAssignment {
    id: number;
    title: string;
    created_at: string;
    created_by_id: number;
}

export interface THomeworkAssignmentTask {
    id: number;
    assignment_id: number;
    task_bank_item_id: number | null;
    lesson_id: number | null;
    title: string;
    task_name: string;
    task: TTeacherAssessmentAnyItem;
    sort: number;
}

export interface THomeworkAssignmentTarget {
    id: number;
    status: "pending" | "completed" | "cancelled";
    assigned_at: string;
    completed_at: string | null;
}

export interface THomeworkTry {
    id: number;
    assignment_id: number;
    target_id: number;
    student_id: number;
    start_datetime: string;
    end_datetime: string | null;
    done_tasks: TStudentAssessmentItems;
    checked_tasks: TAssessmentCheckedItems;
    mistakes_count?: number;
    correct_answers?: number;
}
