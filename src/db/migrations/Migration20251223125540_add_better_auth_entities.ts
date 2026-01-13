import { Migration } from "@mikro-orm/migrations";

export class Migration20251223125540_add_better_auth_entities extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'create table "organizations" ("id" uuid not null default gen_random_uuid(), "created_at" timestamptz not null, "updated_at" timestamptz not null, "name" varchar(255) not null, "slug" varchar(255) not null, "logo" varchar(255) null, "metadata" jsonb null, constraint "organizations_pkey" primary key ("id"));',
    );
    this.addSql(
      'alter table "organizations" add constraint "organizations_slug_unique" unique ("slug");',
    );

    this.addSql(
      'create table "users" ("id" uuid not null default gen_random_uuid(), "created_at" timestamptz not null, "updated_at" timestamptz not null, "email" varchar(255) not null, "email_verified" boolean not null default false, "first_name" varchar(255) not null, "last_name" varchar(255) not null, "name" varchar(255) not null, "image" varchar(255) null, "state" text check ("state" in (\'UNREGISTERED\', \'ACTIVE\', \'INACTIVE\')) not null default \'ACTIVE\', "first_login_at" timestamptz null, constraint "users_pkey" primary key ("id"));',
    );
    this.addSql('alter table "users" add constraint "users_email_unique" unique ("email");');

    this.addSql(
      'create table "sessions" ("id" uuid not null default gen_random_uuid(), "created_at" timestamptz not null, "updated_at" timestamptz not null, "token" varchar(255) not null, "user_id" uuid not null, "expires_at" timestamptz not null, "ip_address" varchar(255) null, "user_agent" text null, "active_organization_id" uuid null, constraint "sessions_pkey" primary key ("id"));',
    );
    this.addSql('alter table "sessions" add constraint "sessions_token_unique" unique ("token");');

    this.addSql(
      'create table "members" ("id" uuid not null default gen_random_uuid(), "created_at" timestamptz not null, "updated_at" timestamptz not null, "organization_id" uuid not null, "user_id" uuid not null, "role" text not null, constraint "members_pkey" primary key ("id"));',
    );

    this.addSql(
      'create table "invitations" ("id" uuid not null default gen_random_uuid(), "created_at" timestamptz not null, "updated_at" timestamptz not null, "organization_id" uuid not null, "email" varchar(255) not null, "role" text not null, "status" text not null, "expires_at" timestamptz not null, "inviter_id" uuid not null, constraint "invitations_pkey" primary key ("id"));',
    );

    this.addSql(
      'create table "accounts" ("id" uuid not null default gen_random_uuid(), "created_at" timestamptz not null, "updated_at" timestamptz not null, "user_id" uuid not null, "account_id" varchar(255) not null, "provider_id" varchar(255) not null, "access_token" text null, "access_token_expires_at" timestamptz null, "refresh_token" text null, "refresh_token_expires_at" timestamptz null, "id_token" text null, "expires_at" timestamptz null, "scope" varchar(255) null, "password" varchar(255) null, constraint "accounts_pkey" primary key ("id"));',
    );

    this.addSql(
      'create table "verifications" ("id" uuid not null default gen_random_uuid(), "created_at" timestamptz not null, "updated_at" timestamptz not null, "identifier" varchar(255) not null, "value" varchar(255) not null, "expires_at" timestamptz not null, constraint "verifications_pkey" primary key ("id"));',
    );

    this.addSql(
      'alter table "sessions" add constraint "sessions_user_id_foreign" foreign key ("user_id") references "users" ("id") on update cascade;',
    );

    this.addSql(
      'alter table "members" add constraint "members_organization_id_foreign" foreign key ("organization_id") references "organizations" ("id") on update cascade;',
    );
    this.addSql(
      'alter table "members" add constraint "members_user_id_foreign" foreign key ("user_id") references "users" ("id") on update cascade;',
    );

    this.addSql(
      'alter table "invitations" add constraint "invitations_organization_id_foreign" foreign key ("organization_id") references "organizations" ("id") on update cascade;',
    );
    this.addSql(
      'alter table "invitations" add constraint "invitations_inviter_id_foreign" foreign key ("inviter_id") references "users" ("id") on update cascade;',
    );

    this.addSql(
      'alter table "accounts" add constraint "accounts_user_id_foreign" foreign key ("user_id") references "users" ("id") on update cascade;',
    );

    this.addSql(
      'alter table "audit_logs" alter column "actor_id" type varchar(255) using ("actor_id"::varchar(255));',
    );
  }

  async down(): Promise<void> {
    this.addSql('alter table "members" drop constraint "members_organization_id_foreign";');

    this.addSql('alter table "invitations" drop constraint "invitations_organization_id_foreign";');

    this.addSql('alter table "sessions" drop constraint "sessions_user_id_foreign";');

    this.addSql('alter table "members" drop constraint "members_user_id_foreign";');

    this.addSql('alter table "invitations" drop constraint "invitations_inviter_id_foreign";');

    this.addSql('alter table "accounts" drop constraint "accounts_user_id_foreign";');

    this.addSql('drop table if exists "organizations" cascade;');

    this.addSql('drop table if exists "users" cascade;');

    this.addSql('drop table if exists "sessions" cascade;');

    this.addSql('drop table if exists "members" cascade;');

    this.addSql('drop table if exists "invitations" cascade;');

    this.addSql('drop table if exists "accounts" cascade;');

    this.addSql('drop table if exists "verifications" cascade;');

    this.addSql(
      'alter table "audit_logs" alter column "actor_id" type int4 using ("actor_id"::int4);',
    );
  }
}
