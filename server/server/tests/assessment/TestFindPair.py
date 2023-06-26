import unittest

from pydantic import ValidationError

from server.models.assessment import (AssessmentTaskName, FindPairTaskReq, FindPairTaskRes, FindPairTaskReqCreate)


class TestAssessmentFindPair(unittest.TestCase):
    def test_FindPairExceptions(self):
        self.assertRaises(ValidationError, FindPairTaskReq, **{"name": AssessmentTaskName.TEXT})
        self.assertRaises(ValidationError, FindPairTaskReqCreate, **{"name": AssessmentTaskName.FIND_PAIR})

    def test_FindPairRes(self):
        value_base = {
            "name": AssessmentTaskName.FIND_PAIR,
            "to_check_first": ["f1", "f2", "f3", "f4", "f5", "f6", "f7"],
            "to_check_second": ["s1", "s2", "s3", "s4", "s5", "s6", "s7"]
        }

        self.assertFalse(
            FindPairTaskRes(**value_base,
                            first=["f1", "f2", "f3", "f4", "f5", "f6"],
                            second=["s1", "s2", "s3", "s4", "s5", "s6", "s7"]).custom_validation())
        self.assertFalse(
            FindPairTaskRes(**value_base,
                            first=["f1", "f2", "f3", "f4", "f5", "f6", "f7"],
                            second=["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8"]).custom_validation())
        self.assertFalse(
            FindPairTaskRes(**value_base,
                            first=["f1", "f2", "f3", "f4", "f5", "f6", "f11"],
                            second=["s1", "s2", "s3", "s4", "s5", "s6", "s7"]).custom_validation())
        self.assertFalse(
            FindPairTaskRes(**value_base,
                            first=["f1", "f2", "f3", "f4", "f5", "f6", "f7"],
                            second=["s1", "s2", "s3", "s4", "s5", "s6", "s11"]).custom_validation())
        self.assertTrue(
            FindPairTaskRes(**value_base,
                            first=["f1", "f2", "f3", "f4", "f5", "f6", "f7"],
                            second=["s1", "s2", "s3", "s4", "s5", "s6", "s7"]).custom_validation())
        self.assertTrue(
            FindPairTaskRes(**value_base,
                            first=["f1", "f3", "f2", "f4", "f7", "f6", "f5"],
                            second=["s1", "s2", "s3", "s4", "s5", "s6", "s7"]).custom_validation())
        self.assertTrue(
            FindPairTaskRes(**value_base,
                            first=["f1", "f3", "f2", "f4", "f7", "f6", "f5"],
                            second=["s6", "s7", "s3", "s4", "s5", "s1", "s2"]).custom_validation())
        self.assertTrue(
            FindPairTaskRes(**value_base,
                            first=["f1", "f2", "f3", "f4", "f5", "f6", "f7"],
                            second=["s7", "s2", "s3", "s4", "s5", "s6", "s1"]).custom_validation())


if __name__ == '__main__':
    unittest.main()