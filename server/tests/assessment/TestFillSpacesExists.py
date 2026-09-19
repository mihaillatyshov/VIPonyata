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

    def test_CreateSentenceRes_WithExtraWords(self):
        value_base = {
            "name": AssessmentTaskName.FILL_SPACES_EXISTS,
            "separates": ["Exist. Fill word after (word):", "and", ": before this (char)"],
            "meta_answers": ["word", "char"],
            "meta_extra_words": ["extra"]
        }

        self.assertEqual(3, len(FillSpacesExistsTaskRes(**value_base).inputs))
        self.assertTrue(
            FillSpacesExistsTaskRes(**value_base, inputs=["extra"], answers=["word", "char"]).custom_validation())
        self.assertTrue(
            FillSpacesExistsTaskRes(**value_base, inputs=["extra", "word"], answers=[None, "char"]).custom_validation())
        self.assertFalse(FillSpacesExistsTaskRes(**value_base, inputs=[], answers=["word", "char"]).custom_validation())

    def test_CreateSentenceTeacherReq_WithEmptyExtraWord(self):
        self.assertRaises(
            ValidationError,
            FillSpacesExistsTaskTeacherReq,
            **{
                "name": AssessmentTaskName.FILL_SPACES_EXISTS,
                "separates": ["start", "end"],
                "meta_answers": ["word"],
                "meta_extra_words": [""]
            },
        )

    def test_CreateSentenceTeacherReq_SavesExtraWords(self):
        task = FillSpacesExistsTaskTeacherReq(
            **{
                "name": AssessmentTaskName.FILL_SPACES_EXISTS,
                "separates": ["start", "end"],
                "meta_answers": ["word"],
                "meta_extra_words": ["extra one", "extra two"],
            }, )

        self.assertEqual(["extra one", "extra two"], task.model_dump()["meta_extra_words"])


if __name__ == '__main__':
    unittest.main()
