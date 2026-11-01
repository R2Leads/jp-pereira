import { boolean, check, doublePrecision, index, integer, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Mensagens enviadas pelos formulários de Contato e Revenda.
export const contactMessages = pgTable("contact_messages", {
  id: serial("id").primaryKey(),
  origin: varchar("origin", { length: 20 }).notNull().default("contato"), // "contato" | "revenda"
  name: varchar("name", { length: 160 }).notNull(),
  email: varchar("email", { length: 160 }).notNull(),
  phone: varchar("phone", { length: 40 }),
  company: varchar("company", { length: 160 }),
  message: text("message").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const locatorPoints = pgTable("locator_points", {
  id: serial("id").primaryKey(),
  version: integer("version").notNull().default(1),
  seedKey: varchar("seed_key", { length: 60 }).unique(),
  name: varchar("name", { length: 160 }).notNull(),
  address: varchar("address", { length: 250 }).notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 2 }).notNull(),
  postalCode: varchar("postal_code", { length: 8 }).notNull(),
  phone: varchar("phone", { length: 30 }).notNull().default(""),
  whatsapp: varchar("whatsapp", { length: 30 }).notNull().default(""),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  geocodeStatus: varchar("geocode_status", { length: 20 }).notNull().default("error"),
  geocodeLabel: text("geocode_label"),
  geocodeConfidence: doublePrecision("geocode_confidence"),
  geocodePrecision: varchar("geocode_precision", { length: 40 }),
  geocodeSource: varchar("geocode_source", { length: 20 }),
  geocodeError: text("geocode_error"),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  active: boolean("active").notNull().default(false),
  cityListingVisible: boolean("city_listing_visible").notNull().default(true),
  isDemo: boolean("is_demo").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
}, table => [
  index("locator_points_public_idx").on(table.active, table.geocodeStatus, table.deletedAt),
  check("locator_points_coordinates_check", sql`(${table.latitude} IS NULL AND ${table.longitude} IS NULL) OR (${table.latitude} IS NOT NULL AND ${table.longitude} IS NOT NULL AND ${table.latitude} BETWEEN -90 AND 90 AND ${table.longitude} BETWEEN -180 AND 180)`),
  check("locator_points_active_check", sql`NOT ${table.active} OR (${table.geocodeStatus} = 'confirmed' AND ${table.latitude} IS NOT NULL AND ${table.longitude} IS NOT NULL AND ${table.deletedAt} IS NULL)`),
]);
export type LocatorPoint = typeof locatorPoints.$inferSelect;
