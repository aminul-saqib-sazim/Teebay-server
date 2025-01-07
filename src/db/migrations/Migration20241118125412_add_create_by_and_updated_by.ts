import { Migration } from "@mikro-orm/migrations";

export class Migration20241118125412_add_create_by_and_updated_by extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'alter table "users" add column "created_by" int null, add column "updated_by" int null;',
    );
    this.addSql(
      'alter table "users" add constraint "users_created_by_foreign" foreign key ("created_by") references "users" ("id") on update cascade on delete set null;',
    );
    this.addSql(
      'alter table "users" add constraint "users_updated_by_foreign" foreign key ("updated_by") references "users" ("id") on update cascade on delete set null;',
    );

    this.addSql(
      'alter table "roles" add column "created_by" int null, add column "updated_by" int null;',
    );
    this.addSql(
      'alter table "roles" add constraint "roles_created_by_foreign" foreign key ("created_by") references "users" ("id") on update cascade on delete set null;',
    );
    this.addSql(
      'alter table "roles" add constraint "roles_updated_by_foreign" foreign key ("updated_by") references "users" ("id") on update cascade on delete set null;',
    );

    this.addSql(
      'alter table "permissions" add column "created_by" int null, add column "updated_by" int null;',
    );
    this.addSql(
      'alter table "permissions" add constraint "permissions_created_by_foreign" foreign key ("created_by") references "users" ("id") on update cascade on delete set null;',
    );
    this.addSql(
      'alter table "permissions" add constraint "permissions_updated_by_foreign" foreign key ("updated_by") references "users" ("id") on update cascade on delete set null;',
    );

    this.addSql(
      'alter table "user_profiles" add column "created_by" int null, add column "updated_by" int null;',
    );
    this.addSql(
      'alter table "user_profiles" add constraint "user_profiles_created_by_foreign" foreign key ("created_by") references "users" ("id") on update cascade on delete set null;',
    );
    this.addSql(
      'alter table "user_profiles" add constraint "user_profiles_updated_by_foreign" foreign key ("updated_by") references "users" ("id") on update cascade on delete set null;',
    );

    this.addSql(
      'alter table "verification_requests" add column "created_by" int null, add column "updated_by" int null;',
    );
    this.addSql(
      'alter table "verification_requests" add constraint "verification_requests_created_by_foreign" foreign key ("created_by") references "users" ("id") on update cascade on delete set null;',
    );
    this.addSql(
      'alter table "verification_requests" add constraint "verification_requests_updated_by_foreign" foreign key ("updated_by") references "users" ("id") on update cascade on delete set null;',
    );
  }

  async down(): Promise<void> {
    this.addSql('alter table "permissions" drop constraint "permissions_created_by_foreign";');
    this.addSql('alter table "permissions" drop constraint "permissions_updated_by_foreign";');

    this.addSql('alter table "roles" drop constraint "roles_created_by_foreign";');
    this.addSql('alter table "roles" drop constraint "roles_updated_by_foreign";');

    this.addSql('alter table "user_profiles" drop constraint "user_profiles_created_by_foreign";');
    this.addSql('alter table "user_profiles" drop constraint "user_profiles_updated_by_foreign";');

    this.addSql('alter table "users" drop constraint "users_created_by_foreign";');
    this.addSql('alter table "users" drop constraint "users_updated_by_foreign";');

    this.addSql(
      'alter table "verification_requests" drop constraint "verification_requests_created_by_foreign";',
    );
    this.addSql(
      'alter table "verification_requests" drop constraint "verification_requests_updated_by_foreign";',
    );

    this.addSql('alter table "permissions" drop column "created_by", drop column "updated_by";');

    this.addSql('alter table "roles" drop column "created_by", drop column "updated_by";');

    this.addSql('alter table "user_profiles" drop column "created_by", drop column "updated_by";');

    this.addSql('alter table "users" drop column "created_by", drop column "updated_by";');

    this.addSql(
      'alter table "verification_requests" drop column "created_by", drop column "updated_by";',
    );
  }
}
