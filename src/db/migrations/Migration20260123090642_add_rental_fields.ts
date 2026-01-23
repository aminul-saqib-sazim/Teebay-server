import { Migration } from '@mikro-orm/migrations';

export class Migration20260123090642_add_rental_fields extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "products" add column "rental_price" numeric(10,2) not null default 0, add column "rent_option" text check ("rent_option" in (\'HOURLY\', \'DAILY\')) null;');
  }

  async down(): Promise<void> {
    this.addSql('alter table "products" drop column "rental_price", drop column "rent_option";');
  }

}
