import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const guests = pgTable("guests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  field: text("field"),
  bio: text("bio"),
  socialReach: integer("social_reach").default(0),
  trendingScore: integer("trending_score").default(0),
  compatibilityScore: integer("compatibility_score").default(0),
  region: text("region").default("global"),
  socialMedia: jsonb("social_media").$type<{
    twitter?: string;
    linkedin?: string;
    youtube?: string;
    followers?: number;
  }>(),
  expertise: text("expertise").array(),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const channels = pgTable("channels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  channelId: text("channel_id").unique().notNull(),
  channelUrl: text("channel_url").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  subscriberCount: integer("subscriber_count").default(0),
  videoCount: integer("video_count").default(0),
  viewCount: integer("view_count").default(0),
  engagementRate: text("engagement_rate").default("0%"),
  topics: text("topics").array(),
  thumbnailUrl: text("thumbnail_url"),
  lastAnalyzed: timestamp("last_analyzed").defaultNow(),
});

export const analyses = pgTable("analyses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  channelId: text("channel_id").notNull(),
  guestName: text("guest_name"),
  guestField: text("guest_field"),
  region: text("region").default("global"),
  compatibilityScore: integer("compatibility_score").default(0),
  audienceOverlap: integer("audience_overlap").default(0),
  trendingFactor: integer("trending_factor").default(0),
  topicOverlap: integer("topic_overlap").default(0),
  riskAssessment: text("risk_assessment").default("Medium"),
  recommendations: text("recommendations").array(),
  detailedReport: jsonb("detailed_report"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const trendingTopics = pgTable("trending_topics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  field: text("field").notNull(),
  score: integer("score").default(0),
  region: text("region").default("global"),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const insertGuestSchema = createInsertSchema(guests).omit({
  id: true,
  lastUpdated: true,
});

export const insertChannelSchema = createInsertSchema(channels).omit({
  id: true,
  lastAnalyzed: true,
});

export const insertAnalysisSchema = createInsertSchema(analyses).omit({
  id: true,
  createdAt: true,
});

export const insertTrendingTopicSchema = createInsertSchema(trendingTopics).omit({
  id: true,
  lastUpdated: true,
});

export type Guest = typeof guests.$inferSelect;
export type Channel = typeof channels.$inferSelect;
export type Analysis = typeof analyses.$inferSelect;
export type TrendingTopic = typeof trendingTopics.$inferSelect;

export type InsertGuest = z.infer<typeof insertGuestSchema>;
export type InsertChannel = z.infer<typeof insertChannelSchema>;
export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;
export type InsertTrendingTopic = z.infer<typeof insertTrendingTopicSchema>;

