import { Migration } from '@mikro-orm/migrations';

export class Migration20260201143124_create_orders_table extends Migration {

  async up(): Promise<void> {
    this.addSql('create table "orders" ("id" uuid not null default gen_random_uuid(), "created_at" timestamptz not null, "updated_at" timestamptz not null, "product_id" uuid not null, "buyer_id" uuid not null, "type" text check ("type" in (\'BUY\', \'RENT\')) not null, "status" text check ("status" in (\'PENDING\', \'COMPLETED\', \'CANCELLED\')) not null default \'COMPLETED\', "price" numeric(10,2) not null, "quantity" int not null, "rent_start_date" timestamptz null, "rent_end_date" timestamptz null, constraint "orders_pkey" primary key ("id"));');

    this.addSql('alter table "orders" add constraint "orders_product_id_foreign" foreign key ("product_id") references "products" ("id") on update cascade;');
    this.addSql('alter table "orders" add constraint "orders_buyer_id_foreign" foreign key ("buyer_id") references "users" ("id") on update cascade;');

    this.addSql('alter table "products" alter column "rental_price" drop default;');
    this.addSql('alter table "products" alter column "rental_price" type numeric(10,2) using ("rental_price"::numeric(10,2));');
  }

  async down(): Promise<void> {
    this.addSql('drop table if exists "orders" cascade;');

    this.addSql('alter table "products" alter column "rental_price" type numeric(10,2) using ("rental_price"::numeric(10,2));');
    this.addSql('alter table "products" alter column "rental_price" set default 0;');
  }

}
