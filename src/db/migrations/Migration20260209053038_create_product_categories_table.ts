import { Migration } from "@mikro-orm/migrations";

export class Migration20260209053038_create_product_categories_table extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'create table "product_categories" ("id" uuid not null default gen_random_uuid(), "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "name" varchar(255) not null, constraint "product_categories_pkey" primary key ("id"));',
    );
    this.addSql(
      'create unique index "product_categories_name_unique" on "product_categories" ("name");',
    );
  }

  async down(): Promise<void> {
    this.addSql('drop table if exists "product_categories";');
  }
}
