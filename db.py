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


def list_borrows(email, limit=10, offset=0):
    conn = get_connection()
    with conn.cursor() as cursor:
        cursor.execute("""
            SELECT
                bo.borrow_id,
                b.title,
                b.author,
                bo.start_date,
                bo.return_date,
                bo.is_returned
            FROM
                book b
            RIGHT JOIN borrow bo ON b.book_id = bo.book_id
            WHERE bo.borrower_email = %s
            ORDER BY bo.is_returned ASC, b.title ASC
            LIMIT %s OFFSET %s;
        """, (email, limit, offset))
        borrows = cursor.fetchall()
        return response_to_dicts(cursor, borrows)
    return borrows


def list_available_books(search="", limit=10, offset=0):
    conn = get_connection()
    with conn.cursor() as cursor:
        cursor.execute("""
            SELECT
                b.book_id,
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
            SELECT EXISTS (
                SELECT 1
                FROM borrow
                WHERE (book_id = %s AND borrower_email = %s AND is_returned = false)
                OR ((SELECT COUNT(*) FROM borrow WHERE borrower_email = %s) > 3)
            ) AS condition_met;
        """, (book_id, borrower_email, borrower_email))
        borrow_not_allowed = cursor.fetchone()[0]
        if borrow_not_allowed:
            raise ValueError(
                "Borrower has reached the maximum limit of 3 active borrows or the book is already borrowed.")
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
        """, (email, password_hash.decode('utf-8')))
        conn.commit()
    return {'email': email, 'password': password}


def delete_borrower(email):
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                DELETE FROM Borrower
                WHERE email = %s;
            """, (email,))
            if cursor.rowcount == 0:
                raise ValueError(f"Borrower with email {email} not found.")
            conn.commit()
        return True
    except psycopg2.Error as e:
        conn.rollback()
        raise e


def return_book(borrow_id):
    conn = get_connection()
    with conn.cursor() as cursor:
        cursor.execute("""
            UPDATE borrow
            SET is_returned = TRUE
            WHERE borrow_id = %s AND is_returned = FALSE;
        """, (borrow_id,))
        if cursor.rowcount == 0:
            raise ValueError("No active borrow found for this book.")
        conn.commit()


def list_active_borrows(limit=10, offset=0):
    conn = get_connection()
    with conn.cursor() as cursor:
        cursor.execute("""
            SELECT
                b.title,
                b.author,
                bo.borrower_email,
                bo.start_date,
                bo.return_date
            FROM
                book b
            JOIN borrow bo ON b.book_id = bo.book_id
            WHERE bo.is_returned = FALSE
            ORDER BY bo.return_date ASC
            LIMIT %s OFFSET %s;
        """, (limit, offset))
        active_borrows = cursor.fetchall()
        return response_to_dicts(cursor, active_borrows)
    return active_borrows


def check_admin_password(password):
    admin_password = config.get('ADMIN', 'PASSWORD')
    return password == admin_password
