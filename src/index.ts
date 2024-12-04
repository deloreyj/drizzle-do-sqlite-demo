/**
 * Welcome to Cloudflare Workers! This is your first Durable Objects application.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your Durable Object in action
 * - Run `npm run deploy` to publish your application
 *
 * Bind resources to your worker in `wrangler.toml`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/durable-objects
 */

import { drizzle, type DrizzleSqliteDODatabase } from 'drizzle-orm/durable-sqlite';
import { DurableObject } from 'cloudflare:workers';
import { migrate } from 'drizzle-orm/durable-sqlite/migrator';
import migrations from '../drizzle/migrations';
import { usersTable } from './db/schema';

export class MyDurableObject extends DurableObject {
	storage: DurableObjectStorage;
	db: DrizzleSqliteDODatabase;

	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		this.storage = ctx.storage;
		this.db = drizzle(this.storage, { logger: false });
		ctx.blockConcurrencyWhile(async () => {
			await this._migrate();
		});
	}

	async _migrate() {
		migrate(this.db, migrations);
	}

	async insert(user: typeof usersTable.$inferInsert) {
		console.log('before inserting', user);
		await this.db.insert(usersTable).values(user);
		console.log('after inserting');
	}

	async select() {
		console.log('before selecting');
		const users = await this.db.select().from(usersTable);
		console.log('selecting', users);
		return users;
	}
}

export default {
	/**
	 * This is the standard fetch handler for a Cloudflare Worker
	 *
	 * @param request - The request submitted to the Worker from the client
	 * @param env - The interface to reference bindings declared in wrangler.toml
	 * @param ctx - The execution context of the Worker
	 * @returns The response to be sent back to the client
	 */
	async fetch(request, env, ctx): Promise<Response> {
		let id: DurableObjectId = env.MY_DURABLE_OBJECT.idFromName('testing');

		let stub = env.MY_DURABLE_OBJECT.get(id);
		console.log('logging before insert in worker');
		stub.insert({
			name: `John ${new Date().toISOString()}`,
			email: 'test@test.com',
			id: crypto.randomUUID(),
		});
		console.log('logging after insert in worker');
		const users = await stub.select();
		console.log('New user created!', users);

		return Response.json(users);
	},
} satisfies ExportedHandler<Env>;
