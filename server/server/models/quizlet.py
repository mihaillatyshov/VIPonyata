from pydantic import BaseModel, model_validator

from server.models.utils import StrExtraSpaceRemove


class QuizletGroupCreateReq(BaseModel):
    title: StrExtraSpaceRemove
    sort: int = 500


class QuizletSubgroupCreateReq(BaseModel):
    title: StrExtraSpaceRemove
    sort: int = 500


class QuizletWordCreateReq(BaseModel):
    subgroup_id: int
    ru: StrExtraSpaceRemove
    word_jp: StrExtraSpaceRemove
    char_jp: StrExtraSpaceRemove | None = None
    img: StrExtraSpaceRemove | None = None

    @model_validator(mode="after")
    def ensure_jp(self) -> "QuizletWordCreateReq":
        if not self.word_jp and not self.char_jp:
            raise ValueError("word_jp or char_jp must be provided")
        return self


class QuizletWordUpdateReq(BaseModel):
    ru: StrExtraSpaceRemove
    word_jp: StrExtraSpaceRemove
    char_jp: StrExtraSpaceRemove | None = None
    img: StrExtraSpaceRemove | None = None


class QuizletWordsBatchCreateReq(BaseModel):
    words: list[QuizletWordCreateReq]


class QuizletPersonalLessonCreateReq(BaseModel):
    title: StrExtraSpaceRemove


class QuizletPersonalWordBatchReq(BaseModel):
    subgroup_id: int
    deleted_ids: list[int] = []
    created: list[QuizletWordCreateReq] = []
    updated: list[dict] = []                                                                                            # {id: int, char_jp?: str, word_jp: str, ru: str}


class QuizletStartSessionReq(BaseModel):
    quiz_type: StrExtraSpaceRemove
    subgroup_ids: list[int] = []
    user_subgroup_ids: list[int] = []
    show_hints: bool = False
    translation_direction: StrExtraSpaceRemove = "jp_to_ru"
    max_words: int | None = None

    @model_validator(mode="after")
    def validate_payload(self) -> "QuizletStartSessionReq":
        if self.quiz_type not in ["pair", "flashcards"]:
            raise ValueError("Unsupported quiz_type")
        if len(self.subgroup_ids) == 0 and len(self.user_subgroup_ids) == 0:
            raise ValueError("At least one subgroup must be selected")
        if self.max_words is not None and self.max_words > 100:
            raise ValueError("max_words must be less than or equal to 100")
        return self


class QuizletPairAttemptReq(BaseModel):
    left_word_id: int
    right_word_id: int


class QuizletFlashcardAnswerReq(BaseModel):
    session_word_id: int
    recognized: bool


class QuizletFlashcardViewedReq(BaseModel):
    session_word_id: int


class QuizletSaveProgressReq(BaseModel):
    queue: list[int]


class QuizletEndSessionReq(BaseModel):
    force_finish: bool = False


class QuizletRetryIncorrectReq(BaseModel):
    source_session_id: int


class QuizletAssignmentPersonalTargetReq(BaseModel):
    student_id: int
    subgroup_ids: list[int] = []

    @model_validator(mode="after")
    def validate_payload(self) -> "QuizletAssignmentPersonalTargetReq":
        if len(self.subgroup_ids) == 0:
            raise ValueError("At least one personal subgroup must be selected")
        return self


class QuizletAssignmentCreateReq(BaseModel):
    title: StrExtraSpaceRemove
    quiz_type: StrExtraSpaceRemove
    subgroup_ids: list[int] = []
    personal_targets: list[QuizletAssignmentPersonalTargetReq] = []
    show_hints: bool = False
    translation_direction: StrExtraSpaceRemove = "jp_to_ru"
    student_ids: list[int] = []

    @model_validator(mode="after")
    def validate_payload(self) -> "QuizletAssignmentCreateReq":
        if self.quiz_type not in ["pair", "flashcards"]:
            raise ValueError("Unsupported quiz_type")
        if len(self.subgroup_ids) == 0 and len(self.personal_targets) == 0:
            raise ValueError("At least one subgroup must be selected")
        if len(self.student_ids) == 0:
            raise ValueError("At least one student must be selected")
        if any(item.student_id not in self.student_ids for item in self.personal_targets):
            raise ValueError("Personal targets must match selected students")
        return self
