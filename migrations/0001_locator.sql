CREATE TABLE IF NOT EXISTS locator_points (
 id serial PRIMARY KEY,
 version integer NOT NULL DEFAULT 1,
 seed_key varchar(60) UNIQUE,
 name varchar(160) NOT NULL,
 address varchar(250) NOT NULL,
 city varchar(100) NOT NULL,
 state varchar(2) NOT NULL,
 postal_code varchar(8) NOT NULL,
 phone varchar(30) NOT NULL DEFAULT '',
 whatsapp varchar(30) NOT NULL DEFAULT '',
 latitude double precision,
 longitude double precision,
 geocode_status varchar(20) NOT NULL DEFAULT 'error' CHECK (geocode_status IN ('error','needs_review','confirmed')),
 geocode_label text,
 geocode_confidence double precision,
 geocode_precision varchar(40),
 geocode_source varchar(20),
 geocode_error text,
 confirmed_at timestamptz,
 active boolean NOT NULL DEFAULT false,
 is_demo boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 deleted_at timestamptz,
 CONSTRAINT locator_points_coordinates_check CHECK (
   (latitude IS NULL AND longitude IS NULL) OR
   (latitude IS NOT NULL AND longitude IS NOT NULL AND latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180)
 ),
 CONSTRAINT locator_points_active_check CHECK (
   NOT active OR (geocode_status = 'confirmed' AND latitude IS NOT NULL AND longitude IS NOT NULL AND deleted_at IS NULL)
 )
);
CREATE INDEX IF NOT EXISTS locator_points_public_idx ON locator_points(active,geocode_status,deleted_at);
ALTER TABLE locator_points ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;

