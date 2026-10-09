import unittest

from server.quizlet_writing import is_writing_answer_correct


class TestQuizletWriting(unittest.TestCase):
    def test_exact_hiragana(self):
        self.assertTrue(is_writing_answer_correct("たべる", "たべる"))

    def test_wrong_answer(self):
        self.assertFalse(is_writing_answer_correct("たべた", "たべる"))

    def test_empty_answer(self):
        self.assertFalse(is_writing_answer_correct("", "たべる"))
        self.assertFalse(is_writing_answer_correct("   ", "たべる"))

    def test_spaces_and_punctuation_ignored(self):
        self.assertTrue(is_writing_answer_correct(" た べ る。", "たべる"))
        self.assertTrue(is_writing_answer_correct("おはよう", "おはよう！"))

    def test_katakana_equals_hiragana(self):
        self.assertTrue(is_writing_answer_correct("こーひー", "コーヒー"))
        self.assertTrue(is_writing_answer_correct("コーヒー", "こーひー"))
        self.assertTrue(is_writing_answer_correct("ｺｰﾋｰ", "コーヒー"))

    def test_kanji_is_not_accepted(self):
        self.assertFalse(is_writing_answer_correct("食べる", "たべる"))

    def test_variants(self):
        self.assertTrue(is_writing_answer_correct("はじ", "はし / はじ"))
        self.assertTrue(is_writing_answer_correct("かいます", "かう、かいます"))
        self.assertFalse(is_writing_answer_correct("はし / はじ", "はし"))


if __name__ == "__main__":
    unittest.main()
