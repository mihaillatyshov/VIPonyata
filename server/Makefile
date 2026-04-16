
.PHONY: dev test reset_db fill_db

dev:
	alembic upgrade head
	python main.py

test: 
	python -m unittest discover -v -c server/tests/assessment -p 'Test*.py'

reset_db:
	python -c "import json; import mysql.connector; cfg = json.load(open('config.json', encoding='utf-8'))['db']; conn = mysql.connector.connect(host=cfg['host'], user=cfg['username'], password=cfg['password']); cur = conn.cursor(); db_name = cfg['database']; cur.execute(f'DROP DATABASE IF EXISTS `{db_name}`'); cur.execute(f'CREATE DATABASE `{db_name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci'); cur.close(); conn.close()"

fill_db:
	$(MAKE) reset_db
	alembic upgrade head
	python -m server.CreateTestDB
