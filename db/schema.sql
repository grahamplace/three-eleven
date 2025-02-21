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
    service_request_id text NOT NULL,
    requested_datetime timestamp without time zone NOT NULL,
    closed_date timestamp without time zone,
    updated_datetime timestamp without time zone,
    status_description text,
    status_notes text,
    agency_responsible text,
    service_name text,
    service_subtype text,
    service_details text,
    address text,
    street text,
    supervisor_district integer,
    neighborhoods_sffind_boundaries text,
    analysis_neighborhood text,
    police_district text,
    source text,
    data_as_of timestamp without time zone,
    data_loaded_at timestamp without time zone,
    lat double precision,
    long double precision,
    latlon public.geometry(Point,4326) GENERATED ALWAYS AS (public.st_setsrid(public.st_makepoint(long, lat), 4326)) STORED,
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
-- Name: idx_service_requests_latlon; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_service_requests_latlon ON public.service_requests USING gist (latlon);


--
-- Name: idx_service_requests_updated_datetime; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_service_requests_updated_datetime ON public.service_requests USING btree (updated_datetime);


--
-- Name: service_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX service_idx ON public.service_requests USING btree (date(requested_datetime), service_name, service_subtype);


--
-- Name: service_idx_v2; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX service_idx_v2 ON public.service_requests USING btree (date(requested_datetime), service_name, service_details);


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
    ('20250124000721'),
    ('20250201194801'),
    ('20250221042408');
