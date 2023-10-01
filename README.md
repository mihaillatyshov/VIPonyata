# VIPonyata

## Server: python

In server folder!!!

### Migrations
- Create migration: `alembic revision --autogenerate -m "main"`
- Add migrations to DB: `alembic upgrade heads`



- Create venv in server folder `python -m venv venv` 
- Start venv `source venv/bin/activate`
- Install requirements `pip install -r requirements.txt`
- Run developer server `python main.py`
- Run tests `./RunTests.sh`

freez req: `pip freeze > requirements.txt`

## Client 
In client folder!!!
- Install requered packages `npm i`
- Run dev server `npm start`