export const company = pgTable('company', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  logoUrl: text('logo_url'),
  bannerUrl: text('banner_url'),
  contactEmail: varchar('contact_email', { length: 255 }),
  contactPhone: varchar('contact_phone', { length: 50 }),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 100 }),
  zipcode: varchar('zipcode', { length: 20 }),
  country: varchar('country', { length: 100 }),
  facebookUrl: varchar('facebook_url', { length: 255 }),
  instagramUrl: varchar('instagram_url', { length: 255 }),
  tiktokUrl: varchar('tiktok_url', { length: 255 }),
  youtubeUrl: varchar('youtube_url', { length: 255 }),
  whatsappPhone: varchar('whatsapp_phone', { length: 50 }),
  callPhone: varchar('call_phone', { length: 50 }),
  stripeFeePercent: decimal('stripe_fee_percent', { precision: 5, scale: 2 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  decimal,
  boolean,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: varchar('role', { length: 20 }).notNull().default('member'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export const teams = pgTable('teams', {
  companyId: integer('company_id').references(() => company.id),
  openingHours: text('opening_hours'),
  openHour: varchar('open_hour', { length: 10 }), // Ej: '08:00', '8:00 AM'
  closeHour: varchar('close_hour', { length: 10 }), // Ej: '22:00', '10:00 PM'
  hourFormat: varchar('hour_format', { length: 10 }), // '24h' o '12h'
  bannerUrl: text('banner_url'),
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  username: varchar('username', { length: 50 }).unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  stripeCustomerId: text('stripe_customer_id').unique(),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  stripeProductId: text('stripe_product_id'),
  planName: varchar('plan_name', { length: 50 }),
  subscriptionStatus: varchar('subscription_status', { length: 20 }),
  stripeConnectAccountId: text('stripe_connect_account_id').unique(),
  // Datos bancarios USA
  bank_name: varchar('bank_name', { length: 100 }),
  routingNumber: varchar('routing_number', { length: 20 }),
  accountNumber: varchar('account_number', { length: 20 }),
  // Contact info shown in customer emails and public menu
  contactEmail: varchar('contact_email', { length: 255 }),
  contactPhone: varchar('contact_phone', { length: 50 }),
  line1: text('line1'),
  line2: text('line2'),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 100 }),
  zipcode: varchar('zipcode', { length: 20 }),
  country: varchar('country', { length: 100 }),
  profilePictureUrl: text('profile_picture_url'),
  description: text('description'),
  facebookUrl: varchar('facebook_url', { length: 255 }),
  instagramUrl: varchar('instagram_url', { length: 255 }),
  tiktokUrl: varchar('tiktok_url', { length: 255 }),
  youtubeUrl: varchar('youtube_url', { length: 255 }),
  whatsappPhone: varchar('whatsapp_phone', { length: 50 }),
  callPhone: varchar('call_phone', { length: 50 }),
});

export const teamMembers = pgTable('team_members', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  role: varchar('role', { length: 50 }).notNull(),
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
});

export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  userId: integer('user_id').references(() => users.id),
  action: text('action').notNull(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  ipAddress: varchar('ip_address', { length: 45 }),
});

export const invitations = pgTable('invitations', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  email: varchar('email', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(),
  invitedBy: integer('invited_by')
    .notNull()
    .references(() => users.id),
  invitedAt: timestamp('invited_at').notNull().defaultNow(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
});

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  position: integer('position').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  categoryId: integer('category_id')
    .notNull()
    .references(() => categories.id),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  image: text('image'),
  price: decimal('price', { precision: 10, scale: 2 }),
  currency: varchar('currency', { length: 10 }).notNull().default('MXN'),
  showPicture: boolean('show_picture').notNull().default(true),
  allergenWarning: boolean('allergen_warning').notNull().default(false),
  position: integer('position').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const teamsRelations = relations(teams, ({ many, one }) => ({
  teamMembers: many(teamMembers),
  activityLogs: many(activityLogs),
  invitations: many(invitations),
  categories: many(categories),
  products: many(products),
  teamPolicy: one(teamPolicies),
}));

export const usersRelations = relations(users, ({ many }) => ({
  teamMembers: many(teamMembers),
  invitationsSent: many(invitations),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  team: one(teams, {
    fields: [invitations.teamId],
    references: [teams.id],
  }),
  invitedBy: one(users, {
    fields: [invitations.invitedBy],
    references: [users.id],
  }),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  team: one(teams, {
    fields: [activityLogs.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  team: one(teams, {
    fields: [categories.teamId],
    references: [teams.id],
  }),
  products: many(products),
}));

export const productsRelations = relations(products, ({ one }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  team: one(teams, {
    fields: [products.teamId],
    references: [teams.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
export type TeamMember = typeof teamMembers.$inferSelect;
export type NewTeamMember = typeof teamMembers.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type TeamDataWithMembers = Team & {
  teamMembers: (TeamMember & {
    user: Pick<User, 'id' | 'name' | 'email'>;
  })[];
};

// Tabla de impuestos (local y Stripe)
export const taxes = pgTable('taxes', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id').notNull().references(() => teams.id),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  percentage: decimal('percentage', { precision: 5, scale: 2 }).notNull(),
  isStripe: boolean('is_stripe').notNull().default(false),
  stripeTaxId: varchar('stripe_tax_id', { length: 100 }),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Tabla de precios (por si hay variantes o cambios futuros)
export const prices = pgTable('prices', {
  id: serial('id').primaryKey(),
  productId: integer('product_id').notNull().references(() => products.id),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 10 }).notNull().default('MXN'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Relación producto-impuesto (muchos a muchos)
export const productTaxes = pgTable('product_taxes', {
  id: serial('id').primaryKey(),
  productId: integer('product_id').notNull().references(() => products.id),
  taxId: integer('tax_id').notNull().references(() => taxes.id),
});

// Relaciones
export const taxesRelations = relations(taxes, ({ one, many }) => ({
  team: one(teams, {
    fields: [taxes.teamId],
    references: [teams.id],
  }),
  productTaxes: many(productTaxes),
}));

export const pricesRelations = relations(prices, ({ one }) => ({
  product: one(products, {
    fields: [prices.productId],
    references: [products.id],
  }),
}));

export const productTaxesRelations = relations(productTaxes, ({ one }) => ({
  product: one(products, {
    fields: [productTaxes.productId],
    references: [products.id],
  }),
  tax: one(taxes, {
    fields: [productTaxes.taxId],
    references: [taxes.id],
  }),
}));

export type Tax = typeof taxes.$inferSelect;
export type NewTax = typeof taxes.$inferInsert;
export type Price = typeof prices.$inferSelect;
export type NewPrice = typeof prices.$inferInsert;
export type ProductTax = typeof productTaxes.$inferSelect;
export type NewProductTax = typeof productTaxes.$inferInsert;

// ─── Team Policies ────────────────────────────────────────────────────────────
export const teamPolicies = pgTable('team_policies', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id').notNull().unique().references(() => teams.id),
  warnRawIngredients: boolean('warn_raw_ingredients').notNull().default(false),
  warnAllergens: boolean('warn_allergens').notNull().default(false),
  warnAlcohol: boolean('warn_alcohol').notNull().default(false),
  warnGluten: boolean('warn_gluten').notNull().default(false),
  warnNuts: boolean('warn_nuts').notNull().default(false),
  warnDairy: boolean('warn_dairy').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const teamPoliciesRelations = relations(teamPolicies, ({ one }) => ({
  team: one(teams, { fields: [teamPolicies.teamId], references: [teams.id] }),
}));

export type TeamPolicy = typeof teamPolicies.$inferSelect;
export type NewTeamPolicy = typeof teamPolicies.$inferInsert;

// ─── Sizes ────────────────────────────────────────────────────────────────────
export const sizes = pgTable('sizes', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id').notNull().references(() => teams.id),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  image: text('image'),
  showPicture: boolean('show_picture').notNull().default(false),
  price: decimal('price', { precision: 10, scale: 2 }).notNull().default('0'),
  currency: varchar('currency', { length: 10 }).notNull().default('MXN'),
  position: integer('position').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ─── Extras ───────────────────────────────────────────────────────────────────
export const extras = pgTable('extras', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id').notNull().references(() => teams.id),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  image: text('image'),
  showPicture: boolean('show_picture').notNull().default(false),
  price: decimal('price', { precision: 10, scale: 2 }).notNull().default('0'),
  currency: varchar('currency', { length: 10 }).notNull().default('MXN'),
  position: integer('position').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ─── Additions ────────────────────────────────────────────────────────────────
export const additions = pgTable('additions', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id').notNull().references(() => teams.id),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  image: text('image'),
  showPicture: boolean('show_picture').notNull().default(false),
  price: decimal('price', { precision: 10, scale: 2 }).notNull().default('0'),
  currency: varchar('currency', { length: 10 }).notNull().default('MXN'),
  position: integer('position').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ─── Junction tables ──────────────────────────────────────────────────────────
export const productSizes = pgTable('product_sizes', {
  id: serial('id').primaryKey(),
  productId: integer('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  sizeId: integer('size_id').notNull().references(() => sizes.id, { onDelete: 'cascade' }),
});

export const productExtras = pgTable('product_extras', {
  id: serial('id').primaryKey(),
  productId: integer('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  extraId: integer('extra_id').notNull().references(() => extras.id, { onDelete: 'cascade' }),
});

export const productAdditions = pgTable('product_additions', {
  id: serial('id').primaryKey(),
  productId: integer('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  additionId: integer('addition_id').notNull().references(() => additions.id, { onDelete: 'cascade' }),
});

// ─── Relations ────────────────────────────────────────────────────────────────
export const sizesRelations = relations(sizes, ({ one, many }) => ({
  team: one(teams, { fields: [sizes.teamId], references: [teams.id] }),
  productSizes: many(productSizes),
}));

export const extrasRelations = relations(extras, ({ one, many }) => ({
  team: one(teams, { fields: [extras.teamId], references: [teams.id] }),
  productExtras: many(productExtras),
}));

export const additionsRelations = relations(additions, ({ one, many }) => ({
  team: one(teams, { fields: [additions.teamId], references: [teams.id] }),
  productAdditions: many(productAdditions),
}));

export const productSizesRelations = relations(productSizes, ({ one }) => ({
  product: one(products, { fields: [productSizes.productId], references: [products.id] }),
  size: one(sizes, { fields: [productSizes.sizeId], references: [sizes.id] }),
}));

export const productExtrasRelations = relations(productExtras, ({ one }) => ({
  product: one(products, { fields: [productExtras.productId], references: [products.id] }),
  extra: one(extras, { fields: [productExtras.extraId], references: [extras.id] }),
}));

export const productAdditionsRelations = relations(productAdditions, ({ one }) => ({
  product: one(products, { fields: [productAdditions.productId], references: [products.id] }),
  addition: one(additions, { fields: [productAdditions.additionId], references: [additions.id] }),
}));

// ─── Types ────────────────────────────────────────────────────────────────────
export type Size = typeof sizes.$inferSelect;
export type NewSize = typeof sizes.$inferInsert;
export type Extra = typeof extras.$inferSelect;
export type NewExtra = typeof extras.$inferInsert;
export type Addition = typeof additions.$inferSelect;
export type NewAddition = typeof additions.$inferInsert;
export type ProductSize = typeof productSizes.$inferSelect;
export type ProductExtra = typeof productExtras.$inferSelect;
export type ProductAddition = typeof productAdditions.$inferSelect;

export enum ActivityType {
  SIGN_UP = 'SIGN_UP',
  SIGN_IN = 'SIGN_IN',
  SIGN_OUT = 'SIGN_OUT',
  UPDATE_PASSWORD = 'UPDATE_PASSWORD',
  DELETE_ACCOUNT = 'DELETE_ACCOUNT',
  UPDATE_ACCOUNT = 'UPDATE_ACCOUNT',
  CREATE_TEAM = 'CREATE_TEAM',
  REMOVE_TEAM_MEMBER = 'REMOVE_TEAM_MEMBER',
  INVITE_TEAM_MEMBER = 'INVITE_TEAM_MEMBER',
  ACCEPT_INVITATION = 'ACCEPT_INVITATION',
}
