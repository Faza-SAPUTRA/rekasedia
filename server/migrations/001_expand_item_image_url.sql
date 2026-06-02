-- Uploaded product images are stored as base64 Data URLs by the current UI.
-- VARCHAR(255) only supports the seeded asset paths and rejects uploaded files.
ALTER TABLE items
  ALTER COLUMN image_url TYPE TEXT;
