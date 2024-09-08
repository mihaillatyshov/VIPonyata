# VIPonyata

## Server: python

In server folder!!!    

### Run

**Python 3.10.4 required**

- Create venv in server folder `python -m venv venv` 
- Start venv `source venv/bin/activate`
- Install requirements `pip install -r requirements.txt`
- Run developer server `python main.py`
- Run tests `./RunTests.sh`


### Migrations

- Create migration: `alembic revision --autogenerate -m "main"`
- Add migrations to DB: `alembic upgrade heads`


freez req: `pip freeze > requirements.txt`


## Client 

In client folder!!!

- Install requered packages `npm i`
- Run dev server `npm start`