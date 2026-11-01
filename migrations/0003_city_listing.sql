-- Visibilidade por cidade é independente de localização confirmada e distância.
ALTER TABLE locator_points
  ADD COLUMN IF NOT EXISTS city_listing_visible boolean NOT NULL DEFAULT true;
