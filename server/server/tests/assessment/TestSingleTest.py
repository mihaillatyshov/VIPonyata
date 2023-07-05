import unittest

from pydantic import ValidationError

from server.models.assessment import (AssessmentTaskName, SingleTestTaskReq, SingleTestTaskRes, SingleTestTaskCreate)


class TestAssessmentSingleTest(unittest.TestCase):
    def test_SingleTestExceptions(self):
        self.assertRaises(ValidationError, SingleTestTaskReq, **{"name": AssessmentTaskName.TEXT})
        self.assertRaises(ValidationError, SingleTestTaskCreate, **{"name": AssessmentTaskName.TEST_SINGLE})

    def test_SingleTestRes(self):
        value_base = {
            "name": AssessmentTaskName.TEST_SINGLE,
            "question": "Ansewer to this question multi",
            "options": ["False 0", "False 1", "True 2", "True 3"]
        }

        self.assertFalse(SingleTestTaskRes(**value_base, answer=-1).custom_validation())
        self.assertFalse(SingleTestTaskRes(**value_base, answer=4).custom_validation())
        self.assertTrue(SingleTestTaskRes(**value_base, answer=None).custom_validation())
        self.assertTrue(SingleTestTaskRes(**value_base, answer=0).custom_validation())
        self.assertTrue(SingleTestTaskRes(**value_base, answer=3).custom_validation())


if __name__ == '__main__':
    unittest.main()