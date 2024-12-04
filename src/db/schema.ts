import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// Example of a users table
export const usersTable = sqliteTable('users', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull(),
});
