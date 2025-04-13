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


def response_to_dicts(cur, rows):
    colnames = [desc[0] for desc in cur.description]
    return [dict(zip(colnames, row)) for row in rows]


def list_available_books(search="", limit=10, offset=0):
    conn = get_connection()
    with conn.cursor() as cursor:
        cursor.execute("""
            SELECT
                b.title,
                b.author,
                b.place,
                b.publisher,
                b.genre,
                b.quantity - COALESCE(active_borrows.count, 0) AS available_copies
            FROM
                Book b
            LEFT JOIN (
                SELECT
                    book_id,
                    COUNT(*) AS count
                FROM
                    Borrow
                WHERE
                    is_returned = FALSE
                GROUP BY
                    book_id
            ) AS active_borrows ON b.book_id = active_borrows.book_id
            WHERE
                COALESCE(active_borrows.count, 0) < b.quantity
                AND LOWER(b.title) LIKE LOWER(%s)
            ORDER BY b.title ASC
            LIMIT %s OFFSET %s;
        """, (f'%{search}%', limit, offset))
        books = cursor.fetchall()
        return response_to_dicts(cursor, books)
    return books
