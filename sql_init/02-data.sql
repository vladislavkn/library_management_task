--
-- PostgreSQL database dump
--

-- Dumped from database version 16.8
-- Dumped by pg_dump version 16.8

-- Started on 2025-04-12 16:44:09 UTC

\connect library_db

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 3408 (class 0 OID 16397)
-- Dependencies: 217
-- Data for Name: book; Type: TABLE DATA; Schema: public; Owner: library_user
--

COPY public.book (book_id, title, author, place, quantity, publisher, genre) FROM stdin;
1	The People of the Abyss	Jack London	Shelf A1	5	Macmillan	Non-fiction
2	The Last Wish	Andrzej Sapkowski	Shelf B2	3	SuperNOWA	Fantasy
3	Cloud Atlas	David Mitchell	Shelf C3	4	Sceptre	Speculative Fiction
4	Brave New World	Aldous Huxley	Shelf D4	6	Chatto & Windus	Dystopian
5	Nightfall	Isaac Asimov	Shelf E1	2	Street & Smith	Science Fiction
6	Berserk	Kentaro Miura	Shelf F5	10	Hakusensha	Manga
7	Northern Lights (The Golden Compass)	Philip Pullman	Shelf G3	3	Scholastic	Fantasy
8	The Great Gatsby	F. Scott Fitzgerald	Shelf H2	4	Scribner	Classic
9	The Last Samurai	Helen DeWitt	Shelf I6	1	Talk Miramax Books	Literary Fiction
10	The Dream Room	Erich Maria Remarque	Shelf J1	2	Atlantic Books	Drama
\.


--
-- TOC entry 3406 (class 0 OID 16389)
-- Dependencies: 215
-- Data for Name: borrower; Type: TABLE DATA; Schema: public; Owner: library_user
--

COPY public.borrower (email, password_hash) FROM stdin;
alice@example.com	hash1
bob@example.com	hash2
carol@example.com	hash3
\.


--
-- TOC entry 3410 (class 0 OID 16407)
-- Dependencies: 219
-- Data for Name: borrow; Type: TABLE DATA; Schema: public; Owner: library_user
--

COPY public.borrow (borrow_id, book_id, borrower_email, start_date, return_date, is_returned) FROM stdin;
1	1	alice@example.com	2025-04-01	2025-04-10	t
2	2	alice@example.com	2025-04-05	2025-05-05	f
3	3	bob@example.com	2025-03-28	2025-04-03	t
4	4	carol@example.com	2025-04-07	2025-05-03	f
5	9	bob@example.com	2025-04-10	2025-05-10	f
\.


--
-- TOC entry 3416 (class 0 OID 0)
-- Dependencies: 216
-- Name: book_book_id_seq; Type: SEQUENCE SET; Schema: public; Owner: library_user
--

SELECT pg_catalog.setval('public.book_book_id_seq', 10, true);


--
-- TOC entry 3417 (class 0 OID 0)
-- Dependencies: 218
-- Name: borrow_borrow_id_seq; Type: SEQUENCE SET; Schema: public; Owner: library_user
--

SELECT pg_catalog.setval('public.borrow_borrow_id_seq', 5, true);


-- Completed on 2025-04-12 16:44:09 UTC

--
-- PostgreSQL database dump complete
--

