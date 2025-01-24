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
-- Name: postgis; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;


--
-- Name: EXTENSION postgis; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION postgis IS 'PostGIS geometry and geography spatial types and functions';


--
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schema_migrations (
    version character varying(128) NOT NULL
);


--
-- Name: service_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.service_requests (
    service_request_id bigint NOT NULL,
    requested_datetime timestamp without time zone NOT NULL,
    closed_date timestamp without time zone,
    updated_datetime timestamp without time zone,
    status_description character varying(255),
    status_notes text,
    agency_responsible character varying(255),
    service_name character varying(255),
    service_subtype character varying(255),
    service_details text,
    address text,
    street character varying(255),
    supervisor_district numeric,
    neighborhoods_sffind_boundaries character varying(255),
    analysis_neighborhood character varying(255),
    police_district character varying(255),
    source character varying(255),
    data_as_of timestamp without time zone,
    data_loaded_at timestamp without time zone,
    lat double precision,
    long double precision,
    geom public.geometry(Point,4326),
    media_url text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: service_requests service_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_requests
    ADD CONSTRAINT service_requests_pkey PRIMARY KEY (service_request_id);


--
-- Name: service_requests trigger_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_set_updated_at BEFORE UPDATE ON public.service_requests FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- PostgreSQL database dump complete
--


--
-- Dbmate schema migrations
--

INSERT INTO public.schema_migrations (version) VALUES
    ('20250123235513'),
    ('20250124000721');
