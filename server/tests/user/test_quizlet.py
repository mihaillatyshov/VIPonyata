import datetime
import json

from server.common import DBsession
from server.models.db_models import QuizletSession, QuizletSessionWord, User
from server.models.quizlet import QuizletFlashcardAnswerReq
from server.queries import StudentDBqueries


def test_flashcard_incorrect_answer_requeues_word_at_random_later_position(create_db, monkeypatch):
    DBsession.init(create_db)

    with DBsession.begin() as session:
        user = User(name="Quizlet Student",
                    nickname="quizlet_student",
                    password="password123",
                    birthday=datetime.date(2000, 1, 1),
                    level=User.Level.STUDENT)
        session.add(user)
        session.flush()

        quiz_session = QuizletSession(quiz_type=QuizletSession.Type.FLASHCARDS,
                                      show_hints=False,
                                      translation_direction="jp_to_ru",
                                      total_words=4,
                                      user_id=user.id,
                                      queue_state="[]")
        session.add(quiz_session)
        session.flush()

        words = [
            QuizletSessionWord(source_type="combined",
                               source_word_id=index + 1,
                               char_jp=f"漢字{index + 1}",
                               word_jp=f"かな{index + 1}",
                               ru=f"перевод {index + 1}",
                               session_id=quiz_session.id)
            for index in range(4)
        ]
        session.add_all(words)
        session.flush()

        word_ids = [word.id for word in words]
        quiz_session.queue_state = json.dumps(word_ids)

    monkeypatch.setattr(StudentDBqueries.random, "randint", lambda start, end: 2)

    StudentDBqueries.mark_quizlet_flashcard_answer(
        user.id,
        quiz_session.id,
        QuizletFlashcardAnswerReq(session_word_id=word_ids[0], recognized=False),
    )

    with DBsession.begin() as session:
        updated_session = session.get(QuizletSession, quiz_session.id)
        updated_word = session.get(QuizletSessionWord, word_ids[0])

        assert updated_session is not None
        assert updated_word is not None
        assert json.loads(updated_session.queue_state) == [word_ids[1], word_ids[2], word_ids[0], word_ids[3]]
        assert updated_session.incorrect_answers == 1
        assert updated_word.incorrect_attempts == 1
        assert updated_word.is_correct is False