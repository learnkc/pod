import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "../shared/schema";

// For development, use SQLite in-memory database
const sqlite = new Database(":memory:");
export const db = drizzle(sqlite, { schema });

// Create tables for in-memory database
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS guests (
    id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
    name TEXT NOT NULL,
    field TEXT,
    bio TEXT,
    social_reach INTEGER DEFAULT 0,
    trending_score INTEGER DEFAULT 0,
    compatibility_score INTEGER DEFAULT 0,
    region TEXT DEFAULT 'global',
    social_media TEXT,
    expertise TEXT,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS channels (
    id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
    channel_id TEXT UNIQUE NOT NULL,
    channel_url TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    subscriber_count INTEGER DEFAULT 0,
    video_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    engagement_rate TEXT DEFAULT '0%',
    topics TEXT,
    thumbnail_url TEXT,
    last_analyzed DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS analyses (
    id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
    channel_id TEXT NOT NULL,
    guest_name TEXT,
    guest_field TEXT,
    region TEXT DEFAULT 'global',
    compatibility_score INTEGER DEFAULT 0,
    audience_overlap INTEGER DEFAULT 0,
    trending_factor INTEGER DEFAULT 0,
    topic_overlap INTEGER DEFAULT 0,
    risk_assessment TEXT DEFAULT 'Medium',
    recommendations TEXT,
    detailed_report TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS trending_topics (
    id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
    name TEXT NOT NULL,
    field TEXT NOT NULL,
    score INTEGER DEFAULT 0,
    region TEXT DEFAULT 'global',
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);