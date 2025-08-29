import { Migration } from '@mikro-orm/migrations';

export class Migration20250829143620 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "company" add column if not exists "metadata" jsonb null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "company" drop column if exists "metadata";`);
  }

}
