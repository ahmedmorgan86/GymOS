-- Technical global daily counter: contains no tenant IDs, member data or credentials.
-- Global allocation is required by the existing globally unique card registry.
CREATE TABLE IF NOT EXISTS gymos.card_number_counters(
 day text PRIMARY KEY CHECK(day ~ '^[0-9]{8}$'),
 value integer NOT NULL CHECK(value BETWEEN 1 AND 99999999)
);
ALTER TABLE gymos.card_number_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE gymos.card_number_counters FORCE ROW LEVEL SECURITY;
CREATE POLICY card_number_allocator ON gymos.card_number_counters TO gymos_app USING(true) WITH CHECK(true);
REVOKE ALL ON gymos.card_number_counters FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON gymos.card_number_counters TO gymos_app;
