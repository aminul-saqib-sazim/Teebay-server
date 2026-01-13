/**
 * MikroORM Adapter for Better Auth
 *
 * Why `any` types are required:
 *
 * Better Auth's CustomAdapter interface uses generic type parameters to preserve type safety
 * across different entity models (User, Session, Account, etc.). The interface is defined as:
 *
 * interface CustomAdapter {
 *   create: <T extends Record<string, any>>({ data, model, select }:....) => Promise<T>;
 *   findOne: <T>({ model, where, select }:...) => Promise<T | null>;
 *   findMany: <T>({ model, where, ... }:...) => Promise<T[]>;
 *   update: <T>(data: { update: T; ... }) => Promise<T | null>;
 *   updateMany: (data: { update: Record<string, any>; ... }) => Promise<number>;
 * }
 *
 * The generic `T` is determined at *call-time* by Better Auth based on which model is being
 * queried (e.g., T = User when querying users table). This allows Better Auth to:
 * 1. Accept any entity shape without knowing them upfront
 * 2. Return the same type that was passed in (type preservation)
 * 3. Work with plugins that add custom fields
 *
 * Since our adapter implementation doesn't know what `T` will be until Better Auth calls it,
 * we cannot use concrete types like `Record<string, unknown>`. We must use `any` to match
 * the interface signature exactly. Better Auth provides the type safety at the call site,
 * not in the adapter implementation.
 *
 * Summary: `any` is required here because Better Auth uses higher-kinded types (generics determined
 * at call-time) which TypeScript can only express through `any` in the adapter implementation.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { FindOptions, MikroORM } from "@mikro-orm/core";

import { createAdapter } from "better-auth/adapters";
import { dset } from "dset";

import { createAdapterUtils } from "./mikro-orm.adapter.helpers";
import type { IMikroOrmAdapterConfig } from "./mikro-orm.adapter.interfaces";

/**
 * Creates MikroORM adapter for Better Auth.
 *
 * Current limitations:
 *   * No m:m and 1:m and embedded references support
 *   * No complex primary key support
 *   * No schema generation
 *
 * @param orm - Instance of MikroORM returned from `MikroORM.init` or `MikroORM.initSync` methods
 * @param config - Additional configuration for MikroORM adapter
 */
export const mikroOrmAdapter = (
  orm: MikroORM,
  { debugLogs, supportsJSON = true }: IMikroOrmAdapterConfig = {},
) =>
  createAdapter({
    config: {
      debugLogs,
      supportsJSON,
      adapterId: "mikro-orm-adapter",
      adapterName: "MikroORM Adapter",
    },

    adapter() {
      const {
        getEntityMetadata,
        getFieldPath,
        normalizeInput,
        normalizeOutput,
        normalizeWhereClauses,
      } = createAdapterUtils(orm);

      return {
        async create({ model, data, select }) {
          const em = orm.em.fork();
          const metadata = getEntityMetadata(model);
          const input = normalizeInput(metadata, data, em);

          const entity = em.create(metadata.class, input);

          await em.persistAndFlush(entity);

          return normalizeOutput(metadata, entity, select) as typeof data;
        },

        async count({ model, where }): Promise<number> {
          const em = orm.em.fork();
          const metadata = getEntityMetadata(model);

          return em.count(metadata.class, normalizeWhereClauses(metadata, where));
        },

        async findOne({ model, where, select }) {
          const em = orm.em.fork();
          const metadata = getEntityMetadata(model);

          const entity = await em.findOne(metadata.class, normalizeWhereClauses(metadata, where));

          if (!entity) {
            return null;
          }

          return normalizeOutput(metadata, entity, select) as any;
        },

        async findMany({ model, where, limit, offset, sortBy }) {
          const em = orm.em.fork();
          const metadata = getEntityMetadata(model);

          const options: FindOptions<Record<string, unknown>> = {
            limit,
            offset,
          };

          if (sortBy) {
            const path = getFieldPath(metadata, sortBy.field);
            dset(options, ["orderBy", ...path], sortBy.direction);
          }

          const rows = await em.find(
            metadata.class,
            normalizeWhereClauses(metadata, where),
            options,
          );

          return rows.map((row) => normalizeOutput(metadata, row)) as any;
        },

        async update({ model, where, update }) {
          const em = orm.em.fork();
          const metadata = getEntityMetadata(model);

          const entity = await em.findOne(metadata.class, normalizeWhereClauses(metadata, where));

          if (!entity) {
            return null;
          }

          em.assign(entity, normalizeInput(metadata, update as any, em));

          await em.flush();

          return normalizeOutput(metadata, entity) as any;
        },

        async updateMany({ model, where, update }) {
          const em = orm.em.fork();
          const metadata = getEntityMetadata(model);

          return em.nativeUpdate(
            metadata.class,
            normalizeWhereClauses(metadata, where),
            normalizeInput(metadata, update as any, em),
          );
        },

        async delete({ model, where }) {
          const em = orm.em.fork();
          const metadata = getEntityMetadata(model);

          const entity = await em.findOne(
            metadata.class,

            normalizeWhereClauses(metadata, where),

            {
              fields: ["id"],
            },
          );

          if (entity) {
            await em.removeAndFlush(entity);
          }
        },

        async deleteMany({ model, where }) {
          const em = orm.em.fork();
          const metadata = getEntityMetadata(model);

          return em.nativeDelete(metadata.class, normalizeWhereClauses(metadata, where));
        },
      };
    },
  });
