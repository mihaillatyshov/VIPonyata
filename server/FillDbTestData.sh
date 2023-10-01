sudo mysql < "sql_files/drop_create.sql"
alembic upgrade heads
python -m server.CreateTestDB