import unittest

from pydantic import ValidationError

from server.models.assessment import (AssessmentTaskName, FillSpacesByHandTaskStudentReq, FillSpacesByHandTaskRes,
                                      FillSpacesByHandTaskTeacherReq)


class TestAssessmentCreateSentence(unittest.TestCase):
    def test_CreateSentenceExceptions(self):
        self.assertRaises(ValidationError, FillSpacesByHandTaskStudentReq, **{"name": AssessmentTaskName.TEXT})
        self.assertRaises(ValidationError, FillSpacesByHandTaskTeacherReq,
                          **{"name": AssessmentTaskName.FILL_SPACES_BY_HAND})

    def test_CreateSentenceRes(self):
        value_base = {
            "name": AssessmentTaskName.FILL_SPACES_BY_HAND,
            "separates": ["By Hand. Fill word after (word):", "and", ": before this (char)"],
            "meta_answers": ["word", "char"]
        }

        self.assertFalse(FillSpacesByHandTaskRes(**value_base, answers=["word", "char", "char2"]).custom_validation())
        self.assertFalse(FillSpacesByHandTaskRes(**value_base, answers=["word"]).custom_validation())
        self.assertFalse(FillSpacesByHandTaskRes(**value_base, answers=["char"]).custom_validation())
        self.assertFalse(FillSpacesByHandTaskRes(**value_base, answers=[""]).custom_validation())

        self.assertTrue(FillSpacesByHandTaskRes(**value_base, answers=["", ""]).custom_validation())
        self.assertTrue(FillSpacesByHandTaskRes(**value_base, answers=["word", "char"]).custom_validation())
        self.assertTrue(FillSpacesByHandTaskRes(**value_base, answers=["char", "word"]).custom_validation())
        self.assertTrue(FillSpacesByHandTaskRes(**value_base, answers=["some1", "some2"]).custom_validation())
        self.assertTrue(FillSpacesByHandTaskRes(**value_base, answers=["some1", ""]).custom_validation())


if __name__ == '__main__':
    unittest.main()