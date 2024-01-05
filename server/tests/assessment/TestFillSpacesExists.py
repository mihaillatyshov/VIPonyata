import unittest

from pydantic import ValidationError

from server.models.assessment import (AssessmentTaskName, FillSpacesExistsTaskStudentReq, FillSpacesExistsTaskRes,
                                      FillSpacesExistsTaskTeacherReq)


class TestAssessmentCreateSentence(unittest.TestCase):
    def test_CreateSentenceExceptions(self):
        self.assertRaises(ValidationError, FillSpacesExistsTaskStudentReq, **{"name": AssessmentTaskName.TEXT})
        self.assertRaises(ValidationError, FillSpacesExistsTaskTeacherReq,
                          **{"name": AssessmentTaskName.FILL_SPACES_EXISTS})

    def test_CreateSentenceRes(self):
        value_base = {
            "name": AssessmentTaskName.FILL_SPACES_EXISTS,
            "separates": ["Exist. Fill word after (word):", "and", ": before this (char)"],
            "meta_answers": ["word", "char"]
        }

        self.assertFalse(
            FillSpacesExistsTaskRes(**value_base, inputs=[], answers=["word", "char", "char2"]).custom_validation())
        self.assertFalse(FillSpacesExistsTaskRes(**value_base, inputs=[], answers=["word"]).custom_validation())
        self.assertFalse(FillSpacesExistsTaskRes(**value_base, inputs=["word"], answers=["word"]).custom_validation())
        self.assertFalse(FillSpacesExistsTaskRes(**value_base, inputs=["char"], answers=["word"]).custom_validation())
        self.assertFalse(FillSpacesExistsTaskRes(**value_base, inputs=[], answers=[None]).custom_validation())
        self.assertFalse(FillSpacesExistsTaskRes(**value_base, inputs=[], answers=[None, None]).custom_validation())

        self.assertTrue(FillSpacesExistsTaskRes(**value_base, inputs=[], answers=["word", "char"]).custom_validation())
        self.assertTrue(FillSpacesExistsTaskRes(**value_base, inputs=[], answers=["char", "word"]).custom_validation())
        self.assertTrue(
            FillSpacesExistsTaskRes(**value_base, inputs=["char"], answers=["word", None]).custom_validation())
        self.assertTrue(
            FillSpacesExistsTaskRes(**value_base, inputs=["char"], answers=[None, "word"]).custom_validation())
        self.assertTrue(
            FillSpacesExistsTaskRes(**value_base, inputs=["char", "word"], answers=[None, None]).custom_validation())


if __name__ == '__main__':
    unittest.main()