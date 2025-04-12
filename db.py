from flask import g
import psycopg2
from config import config


def get_connection():
    if "db_conn" not in g:
        g.db_conn = psycopg2.connect(
            host=config.get('DATABASE', 'HOST'),
            database=config.get('DATABASE', 'NAME'),
            user=config.get('DATABASE', 'USER'),
            password=config.get('DATABASE', 'PASSWORD')
        )
    return g.db_conn


def close_connection(e=None):
    db_conn = g.pop('db_conn', None)
    if db_conn is not None:
        db_conn.close()
