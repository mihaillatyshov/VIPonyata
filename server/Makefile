
dev:
	alembic upgrade head
	python main.py

test: 
	python -m unittest discover -v -c server/tests/assessment -p 'Test*.py'

fill_db:
	alembic upgrade heads
	python -m server.CreateTestDB
