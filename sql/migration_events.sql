-- Migration: add events/albums/media if users already exists
-- Run this in Neon if you already created the users table

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  event_date DATE,
  cover_url TEXT,
  theme TEXT NOT NULL DEFAULT 'champagne',
  access_mode TEXT NOT NULL DEFAULT 'download'
    CHECK (access_mode IN ('view', 'download', 'hidden')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS events_owner_idx ON events (owner_id);
CREATE INDEX IF NOT EXISTS events_code_idx ON events (code);

CREATE TABLE IF NOT EXISTS albums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS albums_event_idx ON albums (event_id);

CREATE TABLE IF NOT EXISTS media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  album_id UUID REFERENCES albums(id) ON DELETE SET NULL,
  storage_key TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL DEFAULT 0,
  uploaded_by TEXT NOT NULL DEFAULT 'organizer'
    CHECK (uploaded_by IN ('organizer', 'guest')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS media_event_idx ON media (event_id);
CREATE INDEX IF NOT EXISTS media_album_idx ON media (album_id);
