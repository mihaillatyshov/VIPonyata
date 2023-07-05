import unittest

from pydantic import ValidationError

from server.models.assessment import (AssessmentTaskName, TextTaskReq, TextTaskRes, TextTaskCreate)


class TestAssessmentText(unittest.TestCase):
    def test_TextExceptions(self):
        self.assertRaises(ValidationError, TextTaskReq, **{"name": AssessmentTaskName.TEST_SINGLE})
        self.assertRaises(ValidationError, TextTaskCreate, **{"name": AssessmentTaskName.TEXT})

        self.assertTrue(TextTaskRes(name=AssessmentTaskName.TEXT, text="some text").custom_validation())


if __name__ == '__main__':
    unittest.main()