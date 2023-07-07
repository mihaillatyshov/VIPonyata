import unittest

from pydantic import ValidationError

from server.models.assessment import (AssessmentTaskName, CreateSentenceTaskStudentReq, CreateSentenceTaskRes,
                                      CreateSentenceTaskTeacherReq)


class TestAssessmentCreateSentence(unittest.TestCase):
    def test_CreateSentenceExceptions(self):
        self.assertRaises(ValidationError, CreateSentenceTaskStudentReq, **{"name": AssessmentTaskName.TEXT})
        self.assertRaises(ValidationError, CreateSentenceTaskTeacherReq, **{"name": AssessmentTaskName.CREATE_SENTENCE})

    def test_CreateSentenceRes(self):
        value_base = {"name": AssessmentTaskName.CREATE_SENTENCE, "meta_parts": ["Cre1ate", "th2is", "sent3ence"]}

        self.assertFalse(
            CreateSentenceTaskRes(**value_base, parts=["Cre1ate dasdas", "th2is", "sent3ence"]).custom_validation())
        self.assertFalse(
            CreateSentenceTaskRes(**value_base, parts=["Cre1ate", "th2is", "sent3ence", "extra4"]).custom_validation())
        self.assertFalse(CreateSentenceTaskRes(**value_base, parts=["Cre1ate", "th2is"]).custom_validation())
        self.assertFalse(CreateSentenceTaskRes(**value_base, parts=["Cre1ate", "th2is", "th2is"]).custom_validation())

        self.assertTrue(
            CreateSentenceTaskRes(**value_base, parts=["Cre1ate", "sent3ence", "th2is"]).custom_validation())

        self.assertTrue(
            CreateSentenceTaskRes(**value_base, parts=["Cre1ate", "th2is", "sent3ence"]).custom_validation())


if __name__ == '__main__':
    unittest.main()