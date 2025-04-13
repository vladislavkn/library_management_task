from flask import g
import psycopg2
from config import config
from bcrypt import checkpw, hashpw, gensalt
import random
import string


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


def borrow_book(book_id, borrower_email):
    conn = get_connection()
    with conn.cursor() as cursor:
        cursor.execute("""
            SELECT COUNT(*)
            FROM Borrow
            WHERE borrower_email = %s AND is_returned = FALSE;
        """, (borrower_email,))
        active_borrows_count = cursor.fetchone()[0]
        if active_borrows_count >= 3:
            raise ValueError(
                "Borrower has reached the maximum limit of 3 active borrows.")
    with conn.cursor() as cursor:
        cursor.execute("""
            INSERT INTO Borrow (book_id, borrower_email, start_date, return_date)
            VALUES (%s, %s, CURRENT_DATE, CURRENT_DATE + INTERVAL '1 month');
        """, (book_id, borrower_email))
        conn.commit()


def check_password(email, password):
    conn = get_connection()
    with conn.cursor() as cursor:
        cursor.execute("""
            SELECT password_hash
            FROM Borrower
            WHERE email = %s;
        """, (email,))
        if cursor.rowcount == 0:
            return False
        password_hash = cursor.fetchone()[0]
        return checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))


def create_borrower(email):
    password = ''.join(random.choices(
        string.ascii_letters + string.digits, k=16))
    password_hash = hashpw(password.encode('utf-8'), gensalt())
    conn = get_connection()
    with conn.cursor() as cursor:
        cursor.execute("""
            INSERT INTO Borrower (email, password_hash)
            VALUES (%s, %s);
        """, (email, password_hash))
        conn.commit()
    return {'email': email, 'password': password}
