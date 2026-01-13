/**
 * Adapter utility functions for Better Auth MikroORM adapter.
 *
 * This file contains helper functions that normalize data between Better Auth's generic
 * format and MikroORM's entity format. The `any` types here are necessary because:
 * 1. These utilities must work with Better Auth's generic adapter interface (see mikro-orm.adapter.ts)
 * 2. The actual types are determined at runtime based on which entity is being operated on
 * 3. Better Auth's type system relies on call-time generics, not implementation-time types
 */

/* eslint-disable @typescript-eslint/no-explicit-any, eqeqeq */

import type { EntityManager, EntityMetadata } from "@mikro-orm/core";

import type { DBAdapterDebugLogOption } from "@better-auth/core/db/adapter";
import type { Where } from "better-auth";

export interface IMikroOrmAdapterConfig {
  debugLogs?: DBAdapterDebugLogOption;
  supportsJSON?: boolean;
}

export interface IAdapterUtils {
  normalizeEntityName(name: string): string;
  getEntityMetadata(name: string): EntityMetadata;
  getFieldPath(metadata: EntityMetadata, fieldName: string, throwOnShadowProps?: boolean): string[];
  normalizeInput(
    metadata: EntityMetadata,

    input: Record<string, any>,
    em?: EntityManager,
  ): Record<string, any>;
  normalizeOutput(
    metadata: EntityMetadata,

    output: Record<string, any>,
    select?: string[],
  ): Record<string, any>;
  normalizeWhereClauses(metadata: EntityMetadata, where?: Where[]): Record<string, any>;
}
