import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, blob } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const guests = sqliteTable("guests", {
  id: text("id").primaryKey().default(sql`(hex(randomblob(16)))`),
  name: text("name").notNull(),
  field: text("field"),
  bio: text("bio"),
  socialReach: integer("social_reach").default(0),
  trendingScore: integer("trending_score").default(0),
  compatibilityScore: integer("compatibility_score").default(0),
  region: text("region").default("global"),
  socialMedia: text("social_media").$type<string>(), // JSON string
  expertise: text("expertise").$type<string>(), // JSON string array
  lastUpdated: text("last_updated").default(sql`CURRENT_TIMESTAMP`),
});

export const channels = sqliteTable("channels", {
  id: text("id").primaryKey().default(sql`(hex(randomblob(16)))`),
  channelId: text("channel_id").unique().notNull(),
  channelUrl: text("channel_url").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  subscriberCount: integer("subscriber_count").default(0),
  videoCount: integer("video_count").default(0),
  viewCount: integer("view_count").default(0),
  engagementRate: text("engagement_rate").default("0%"),
  topics: text("topics").$type<string>(), // JSON string array
  thumbnailUrl: text("thumbnail_url"),
  lastAnalyzed: text("last_analyzed").default(sql`CURRENT_TIMESTAMP`),
});

export const analyses = sqliteTable("analyses", {
  id: text("id").primaryKey().default(sql`(hex(randomblob(16)))`),
  channelId: text("channel_id").notNull(),
  guestName: text("guest_name"),
  guestField: text("guest_field"),
  region: text("region").default("global"),
  compatibilityScore: integer("compatibility_score").default(0),
  audienceOverlap: integer("audience_overlap").default(0),
  trendingFactor: integer("trending_factor").default(0),
  topicOverlap: integer("topic_overlap").default(0),
  riskAssessment: text("risk_assessment").default("Medium"),
  recommendations: text("recommendations").$type<string>(), // JSON string array
  detailedReport: text("detailed_report").$type<string>(), // JSON string
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const trendingTopics = sqliteTable("trending_topics", {
  id: text("id").primaryKey().default(sql`(hex(randomblob(16)))`),
  name: text("name").notNull(),
  field: text("field").notNull(),
  score: integer("score").default(0),
  region: text("region").default("global"),
  lastUpdated: text("last_updated").default(sql`CURRENT_TIMESTAMP`),
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

