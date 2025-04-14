--
-- PostgreSQL database dump
--

-- Dumped from database version 16.8
-- Dumped by pg_dump version 16.8

-- Started on 2025-04-12 16:42:51 UTC

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
-- TOC entry 3415 (class 1262 OID 16384)
-- Name: library_db; Type: DATABASE; Schema: -; Owner: library_user
--

ALTER DATABASE library_db OWNER TO library_user;

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 217 (class 1259 OID 16397)
-- Name: book; Type: TABLE; Schema: public; Owner: library_user
--

CREATE TABLE public.book (
    book_id integer NOT NULL,
    title character varying(1024) NOT NULL,
    author character varying(1024),
    place character varying(1024),
    quantity integer NOT NULL,
    publisher character varying(1024),
    genre character varying(1024),
    CONSTRAINT book_quantity_check CHECK ((quantity >= 0))
);


ALTER TABLE public.book OWNER TO library_user;

--
-- TOC entry 216 (class 1259 OID 16396)
-- Name: book_book_id_seq; Type: SEQUENCE; Schema: public; Owner: library_user
--

CREATE SEQUENCE public.book_book_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.book_book_id_seq OWNER TO library_user;

--
-- TOC entry 3416 (class 0 OID 0)
-- Dependencies: 216
-- Name: book_book_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: library_user
--

ALTER SEQUENCE public.book_book_id_seq OWNED BY public.book.book_id;


--
-- TOC entry 219 (class 1259 OID 16407)
-- Name: borrow; Type: TABLE; Schema: public; Owner: library_user
--

CREATE TABLE public.borrow (
    borrow_id integer NOT NULL,
    book_id integer NOT NULL,
    borrower_email character varying(255) NOT NULL,
    start_date date NOT NULL,
    return_date date NOT NULL,
    is_returned boolean DEFAULT false
);


ALTER TABLE public.borrow OWNER TO library_user;

--
-- TOC entry 218 (class 1259 OID 16406)
-- Name: borrow_borrow_id_seq; Type: SEQUENCE; Schema: public; Owner: library_user
--

CREATE SEQUENCE public.borrow_borrow_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.borrow_borrow_id_seq OWNER TO library_user;

--
-- TOC entry 3417 (class 0 OID 0)
-- Dependencies: 218
-- Name: borrow_borrow_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: library_user
--

ALTER SEQUENCE public.borrow_borrow_id_seq OWNED BY public.borrow.borrow_id;


--
-- TOC entry 215 (class 1259 OID 16389)
-- Name: borrower; Type: TABLE; Schema: public; Owner: library_user
--

CREATE TABLE public.borrower (
    email character varying(255) NOT NULL,
    password_hash text NOT NULL
);


ALTER TABLE public.borrower OWNER TO library_user;

--
-- TOC entry 3255 (class 2604 OID 16400)
-- Name: book book_id; Type: DEFAULT; Schema: public; Owner: library_user
--

ALTER TABLE ONLY public.book ALTER COLUMN book_id SET DEFAULT nextval('public.book_book_id_seq'::regclass);


--
-- TOC entry 3256 (class 2604 OID 16410)
-- Name: borrow borrow_id; Type: DEFAULT; Schema: public; Owner: library_user
--

ALTER TABLE ONLY public.borrow ALTER COLUMN borrow_id SET DEFAULT nextval('public.borrow_borrow_id_seq'::regclass);


--
-- TOC entry 3262 (class 2606 OID 16405)
-- Name: book book_pkey; Type: CONSTRAINT; Schema: public; Owner: library_user
--

ALTER TABLE ONLY public.book
    ADD CONSTRAINT book_pkey PRIMARY KEY (book_id);


--
-- TOC entry 3264 (class 2606 OID 16413)
-- Name: borrow borrow_pkey; Type: CONSTRAINT; Schema: public; Owner: library_user
--

ALTER TABLE ONLY public.borrow
    ADD CONSTRAINT borrow_pkey PRIMARY KEY (borrow_id);


--
-- TOC entry 3260 (class 2606 OID 16395)
-- Name: borrower borrower_pkey; Type: CONSTRAINT; Schema: public; Owner: library_user
--

ALTER TABLE ONLY public.borrower
    ADD CONSTRAINT borrower_pkey PRIMARY KEY (email);


--
-- TOC entry 3265 (class 2606 OID 16414)
-- Name: borrow borrow_book_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: library_user
--

ALTER TABLE ONLY public.borrow
    ADD CONSTRAINT borrow_book_id_fkey FOREIGN KEY (book_id) REFERENCES public.book(book_id) ON DELETE CASCADE;


--
-- TOC entry 3266 (class 2606 OID 16419)
-- Name: borrow borrow_borrower_email_fkey; Type: FK CONSTRAINT; Schema: public; Owner: library_user
--

ALTER TABLE ONLY public.borrow
    ADD CONSTRAINT borrow_borrower_email_fkey FOREIGN KEY (borrower_email) REFERENCES public.borrower(email) ON DELETE CASCADE;

CREATE INDEX idx_borrow_borrower_email ON public.borrow(borrower_email);
CREATE INDEX idx_borrow_is_returned ON public.borrow(is_returned);
CREATE INDEX idx_book_title ON public.book(title);


-- Completed on 2025-04-12 16:42:51 UTC

--
-- PostgreSQL database dump complete
--

