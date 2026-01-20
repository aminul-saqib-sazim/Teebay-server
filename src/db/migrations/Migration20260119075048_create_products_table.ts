import { Migration } from '@mikro-orm/migrations';

export class Migration20260119075048_create_products_table extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "roles_permissions" drop constraint "roles_permissions_permission_id_foreign";');

    this.addSql('alter table "roles_permissions" drop constraint "roles_permissions_role_id_foreign";');

    this.addSql('alter table "user_profiles" drop constraint "user_profiles_role_id_foreign";');

    this.addSql('create table "products" ("id" uuid not null default gen_random_uuid(), "created_at" timestamptz not null, "updated_at" timestamptz not null, "title" varchar(255) not null, "description" text not null, "price" numeric(10,2) not null, "quantity" int not null, "categories" text[] not null, "owner_id" uuid not null, constraint "products_pkey" primary key ("id"));');

    this.addSql('alter table "products" add constraint "products_owner_id_foreign" foreign key ("owner_id") references "users" ("id") on update cascade;');

    this.addSql('drop table if exists "permissions" cascade;');

    this.addSql('drop table if exists "roles" cascade;');

    this.addSql('drop table if exists "roles_permissions" cascade;');

    this.addSql('drop table if exists "user_profiles" cascade;');

    this.addSql('drop table if exists "verification_requests" cascade;');
  }

  async down(): Promise<void> {
    this.addSql('create table "permissions" ("id" serial primary key, "created_at" timestamptz(6) not null, "updated_at" timestamptz(6) not null, "name" text check ("name" in (\'CREATE_USER\', \'READ_USER\', \'UPDATE_USER\', \'DELETE_USER\')) not null);');

    this.addSql('create table "roles" ("id" serial primary key, "created_at" timestamptz(6) not null, "updated_at" timestamptz(6) not null, "name" text check ("name" in (\'SUPER_USER\', \'ADMIN\')) not null);');

    this.addSql('create table "roles_permissions" ("role_id" int4 not null, "permission_id" int4 not null, constraint "roles_permissions_pkey" primary key ("role_id", "permission_id"));');

    this.addSql('create table "user_profiles" ("id" serial primary key, "created_at" timestamptz(6) not null, "updated_at" timestamptz(6) not null, "first_name" varchar(255) not null, "last_name" varchar(255) not null, "user_id" int4 not null, "role_id" int4 not null);');
    this.addSql('alter table "user_profiles" add constraint "user_profiles_user_id_unique" unique ("user_id");');

    this.addSql('create table "verification_requests" ("id" serial primary key, "created_at" timestamptz(6) not null, "updated_at" timestamptz(6) not null, "token" varchar(255) not null, "expires_at" timestamptz(6) not null, "status" text check ("status" in (\'ACTIVE\', \'EXPIRED\')) not null default \'ACTIVE\', "type" text check ("type" in (\'EMAIL_VERIFICATION\', \'RESET_PASSWORD\')) not null, "user_id" int4 null);');
    this.addSql('alter table "verification_requests" add constraint "verification_requests_token_unique" unique ("token");');

    this.addSql('alter table "roles_permissions" add constraint "roles_permissions_permission_id_foreign" foreign key ("permission_id") references "permissions" ("id") on update cascade on delete cascade;');
    this.addSql('alter table "roles_permissions" add constraint "roles_permissions_role_id_foreign" foreign key ("role_id") references "roles" ("id") on update cascade on delete cascade;');

    this.addSql('alter table "user_profiles" add constraint "user_profiles_role_id_foreign" foreign key ("role_id") references "roles" ("id") on update cascade on delete no action;');

    this.addSql('drop table if exists "products" cascade;');
  }

}
