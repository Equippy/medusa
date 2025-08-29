import { Migration } from '@mikro-orm/migrations';

export class Migration20250829151107 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "company" drop column if exists "metadata";`);

    this.addSql(`alter table if exists "company" add column if not exists "auth_id" text null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "company" drop column if exists "auth_id";`);

    this.addSql(`alter table if exists "company" add column if not exists "metadata" jsonb null;`);
  }

}
