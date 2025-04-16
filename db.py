from flask import g
from neo4j import GraphDatabase
from config import config
from bcrypt import checkpw, hashpw, gensalt
import random
import string


def get_connection():
    if "db_driver" not in g:
        uri = f"bolt://{config.get('DATABASE', 'HOST')}:{config.get('DATABASE', 'PORT')}"
        g.db_driver = GraphDatabase.driver(
            uri,
            auth=(config.get('DATABASE', 'USER'),
                  config.get('DATABASE', 'PASSWORD'))
        )
    return g.db_driver


def close_connection(e=None):
    db_driver = g.pop('db_driver', None)
    if db_driver is not None:
        db_driver.close()


def list_borrows(email, limit=10, offset=0):
    driver = get_connection()
    with driver.session() as session:
        result = session.run("""
            MATCH (br:Borrower {email: $email})-[b:BORROWED]->(bk:Book)
            RETURN b.borrow_id as borrow_id,
                   bk.title as title,
                   bk.author as author,
                   b.start_date as start_date,
                   b.return_date as return_date,
                   b.is_returned as is_returned
            ORDER BY b.is_returned ASC, bk.title ASC
            SKIP $offset
            LIMIT $limit
        """, email=email, limit=limit, offset=offset)
        return result.data()


def list_available_books(search="", limit=10, offset=0):
    driver = get_connection()
    with driver.session() as session:
        result = session.run("""
            MATCH (b:Book)
            OPTIONAL MATCH (b)<-[bo:BORROWED {is_returned: false}]-()
            WHERE toLower(b.title) CONTAINS toLower($search)
            WITH b, count(bo) as borrowed_count
            WHERE b.quantity > borrowed_count
            RETURN b.book_id as book_id,
                   b.title as title,
                   b.author as author,
                   b.place as place,
                   b.publisher as publisher,
                   b.genre as genre,
                   b.quantity - borrowed_count as available_copies
            ORDER BY b.title ASC
            SKIP $offset
            LIMIT $limit
        """, search=search, limit=limit, offset=offset)
        return result.data()


def borrow_book(book_id, borrower_email):
    driver = get_connection()
    with driver.session() as session:
        session.execute_write(
            borrow_book_tx, borrower_email, book_id)


def borrow_book_tx(tx, borrower_email, book_id):
    active_borrows = tx.run("""
        MATCH (br:Borrower {email: $email})-[b:BORROWED {is_returned: false}]->()
        RETURN count(b) as count
    """, email=borrower_email).single()["count"]
    if active_borrows >= 3:
        raise ValueError(
            "Borrower has reached the maximum limit of 3 active borrows")

    already_borrowed = tx.run("""
        MATCH (br:Borrower {email: $email})-[b:BORROWED {is_returned: false}]->(bk:Book {book_id: toInteger($book_id)})
        RETURN count(b) > 0 as exists
    """, email=borrower_email, book_id=book_id).single()["exists"]
    if already_borrowed:
        raise ValueError("The book is already borrowed by this user")

    print("book id", book_id)
    res = tx.run("""
        MATCH (br:Borrower {email: $email})
        MATCH (b:Book {book_id: toInteger($book_id)})
        WITH br, b
        OPTIONAL MATCH (b)<-[bo:BORROWED {is_returned: false}]-()
        WITH br, b, count(bo) as borrowed_count
        WHERE b.quantity > borrowed_count
        CREATE (br)-[rel:BORROWED {
            borrow_id: randomUUID(),
            start_date: date(),
            return_date: date() + duration('P30D'),
            is_returned: false
        }]->(b)
        RETURN rel
    """, email=borrower_email, book_id=book_id)
    return res.single()


def check_password(email, password):
    driver = get_connection()
    with driver.session() as session:
        result = session.run("""
            MATCH (b:Borrower {email: $email})
            RETURN b.password_hash as password_hash
        """, email=email)
        record = result.single()
        if not record:
            return False
        password_hash = record["password_hash"]
        return checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))


def create_borrower(email):
    password = ''.join(random.choices(
        string.ascii_letters + string.digits, k=16))
    password_hash = hashpw(password.encode('utf-8'), gensalt())
    driver = get_connection()
    with driver.session() as session:
        session.execute_write(create_borrower_tx, email, password_hash)
    return {'email': email, 'password': password}


def create_borrower_tx(tx, email, password_hash):
    tx.run("""
        CREATE (b:Borrower {
            email: $email,
            password_hash: $password_hash
        })
    """, email=email, password_hash=password_hash.decode('utf-8'))
    return True


def delete_borrower(email):
    driver = get_connection()
    with driver.session() as session:
        result = session.run("""
            MATCH (b:Borrower {email: $email})
            DETACH DELETE b
            RETURN count(b) as deleted_count
        """, email=email)
        if result.single()["deleted_count"] == 0:
            raise ValueError(f"Borrower with email {email} not found.")
        return True


def return_book(borrow_id):
    driver = get_connection()
    with driver.session() as session:
        result = session.run("""
            MATCH ()-[b:BORROWED {borrow_id: $borrow_id, is_returned: false}]->()
            SET b.is_returned = true
            RETURN count(b) as updated_count
        """, borrow_id=borrow_id)
        if result.single()["updated_count"] == 0:
            raise ValueError("No active borrow found for this book.")


def list_active_borrows(limit=10, offset=0):
    driver = get_connection()
    with driver.session() as session:
        result = session.run("""
            MATCH (br:Borrower)-[b:BORROWED {is_returned: false}]->(bk:Book)
            RETURN bk.title as title,
                   bk.author as author,
                   br.email as borrower_email,
                   b.start_date as start_date,
                   b.return_date as return_date
            ORDER BY b.return_date ASC
            SKIP $offset
            LIMIT $limit
        """, limit=limit, offset=offset)
        return result.data()


def check_admin_password(password):
    admin_password = config.get('ADMIN', 'PASSWORD')
    return password == admin_password
