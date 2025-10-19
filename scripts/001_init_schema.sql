-- Scuttle Database Schema for Postgres
-- Migrated from SQLite to Postgres

-- Enable UUID extension for potential future use
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tracks table: stores metadata for all tracks
CREATE TABLE IF NOT EXISTS tracks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    artist TEXT,
    duration INTEGER,
    custom_title TEXT,
    custom_artist TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Downloads table: tracks that have been downloaded
CREATE TABLE IF NOT EXISTS downloads (
    id TEXT PRIMARY KEY,
    downloaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    blob_url TEXT NOT NULL,
    file_size BIGINT,
    FOREIGN KEY (id) REFERENCES tracks(id) ON DELETE CASCADE
);

-- Likes table: user-liked tracks
CREATE TABLE IF NOT EXISTS likes (
    id TEXT PRIMARY KEY,
    liked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id) REFERENCES downloads(id) ON DELETE CASCADE
);

-- Playlists table: user-created playlists
CREATE TABLE IF NOT EXISTS playlists (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Playlist tracks: many-to-many relationship
CREATE TABLE IF NOT EXISTS playlist_tracks (
    playlist_id INTEGER NOT NULL,
    track_id TEXT NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    position INTEGER DEFAULT 0,
    FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
    FOREIGN KEY (track_id) REFERENCES downloads(id) ON DELETE CASCADE,
    PRIMARY KEY (playlist_id, track_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tracks_title ON tracks(title);
CREATE INDEX IF NOT EXISTS idx_tracks_artist ON tracks(artist);
CREATE INDEX IF NOT EXISTS idx_downloads_downloaded_at ON downloads(downloaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_likes_liked_at ON likes(liked_at);
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_playlist_id ON playlist_tracks(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_track_id ON playlist_tracks(track_id);

-- Create full-text search index for tracks
CREATE INDEX IF NOT EXISTS idx_tracks_search ON tracks USING gin(to_tsvector('english', title || ' ' || COALESCE(artist, '')));
