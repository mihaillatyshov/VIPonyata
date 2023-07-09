import unittest

from pydantic import ValidationError

from server.models.assessment import (AssessmentTaskName, ClassificationTaskStudentReq, ClassificationTaskRes,
                                      ClassificationTaskTeacherReq)

a_1_1 = "Ansewer 1 (Col1)"
a_1_2 = "Ansewer 2 (Col1)"
a_1_3 = "Ansewer 3 (Col1)"
a_2_1 = "Ansewer 1 (Col2)"
a_2_2 = "Ansewer 2 (Col2)"
a_2_3 = "Ansewer 3 (Col2)"
a_3_1 = "Ansewer 1 (Col3)"
a_3_2 = "Ansewer 2 (Col3)"
a_3_3 = "Ansewer 3 (Col3)"

good_col_1 = [a_1_1, a_1_2, a_1_3]
good_col_2 = [a_2_1, a_2_2, a_2_3]
good_col_3 = [a_3_1, a_3_2, a_3_3]

good_answer = [good_col_1.copy(), good_col_2.copy(), good_col_3.copy()]


class TestAssessmentCreateSentence(unittest.TestCase):
    def test_CreateSentenceExceptions(self):
        self.assertRaises(ValidationError, ClassificationTaskStudentReq, **{"name": AssessmentTaskName.TEXT})
        self.assertRaises(ValidationError, ClassificationTaskTeacherReq, **{"name": AssessmentTaskName.CLASSIFICATION})

    def test_CreateSentenceRes(self):
        value_base = {
            "name": AssessmentTaskName.CLASSIFICATION,
            "titles": ["Col1", "Col2", "Col3"],
            "meta_answers": good_answer.copy()
        }

        self.assertFalse(
            ClassificationTaskRes(**value_base, inputs=[], answers=[["word", "char"], [], []]).custom_validation())
        self.assertFalse(
            ClassificationTaskRes(**value_base,
                                  inputs=["Wrong Input", a_1_2, a_1_3, a_2_1, a_2_2, a_2_3, a_3_1, a_3_2, a_3_3],
                                  answers=[[], [], []]).custom_validation())
        self.assertFalse(
            ClassificationTaskRes(**value_base,
                                  inputs=[],
                                  answers=[
                                      ["Wrong Input", a_1_2, a_1_3],
                                      good_col_2.copy(),
                                      good_col_3.copy(),
                                  ]).custom_validation())
        self.assertFalse(
            ClassificationTaskRes(**value_base,
                                  inputs=[],
                                  answers=[
                                      [a_1_1, a_1_2, a_1_3, "Extra Input"],
                                      good_col_2.copy(),
                                      good_col_3.copy(),
                                  ]).custom_validation())
        self.assertFalse(
            ClassificationTaskRes(**value_base,
                                  inputs=[a_1_1, a_1_2, a_1_3, a_2_1, a_2_2, a_2_3, a_3_1, a_3_2, a_3_3, "Extra Input"],
                                  answers=[[], [], []]).custom_validation())
        self.assertFalse(
            ClassificationTaskRes(**value_base,
                                  inputs=[a_1_1, a_1_2, a_1_3, a_2_1, a_2_2, a_2_3, a_3_1, a_3_2, a_3_3],
                                  answers=[[], []]).custom_validation())
        self.assertFalse(
            ClassificationTaskRes(**value_base,
                                  inputs=[a_1_1, a_1_2, a_1_3, a_2_1, a_2_2, a_2_3, a_3_1, a_3_2, a_3_3],
                                  answers=[[], [], [], []]).custom_validation())

        self.assertTrue(ClassificationTaskRes(**value_base, inputs=[], answers=good_answer.copy()).custom_validation())
        self.assertTrue(
            ClassificationTaskRes(**value_base,
                                  inputs=[a_1_1, a_1_2, a_1_3, a_2_1, a_2_2, a_2_3, a_3_1],
                                  answers=[[], [a_3_2, a_3_3], []]).custom_validation())
        self.assertTrue(
            ClassificationTaskRes(**value_base,
                                  inputs=[a_1_3, a_2_1, a_2_2, a_2_3, a_3_1, a_3_2, a_3_3],
                                  answers=[[a_1_1], [], [a_1_2]]).custom_validation())
        self.assertTrue(
            ClassificationTaskRes(**value_base,
                                  inputs=[a_1_1, a_1_2, a_1_3, a_2_1, a_2_2, a_2_3, a_3_1, a_3_2, a_3_3],
                                  answers=[[], [], []]).custom_validation())


if __name__ == '__main__':
    unittest.main()