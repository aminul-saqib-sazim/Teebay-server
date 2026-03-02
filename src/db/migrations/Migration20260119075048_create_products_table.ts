import { Migration } from "@mikro-orm/migrations";

export class Migration20260119075048_create_products_table extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'create table "products" ("id" uuid not null default gen_random_uuid(), "created_at" timestamptz not null, "updated_at" timestamptz not null, "title" varchar(255) not null, "description" text not null, "price" numeric(10,2) not null, "quantity" int not null, "categories" text[] not null, "owner_id" uuid not null, constraint "products_pkey" primary key ("id"));',
    );

    this.addSql(
      'alter table "products" add constraint "products_owner_id_foreign" foreign key ("owner_id") references "users" ("id") on update cascade;',
    );
  }

  async down(): Promise<void> {
    this.addSql('drop table if exists "products" cascade;');
  }
}
