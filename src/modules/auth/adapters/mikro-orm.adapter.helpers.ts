/* eslint-disable @typescript-eslint/no-explicit-any, eqeqeq */
import type { EntityMetadata, EntityProperty, MikroORM } from "@mikro-orm/core";
import { ReferenceKind, serialize } from "@mikro-orm/core";

import { BetterAuthError } from "better-auth";
import { dset } from "dset";

import type { IAdapterUtils } from "./mikro-orm.adapter.interfaces";

function createAdapterError(message: string): never {
  throw new BetterAuthError(`[MikroORM Adapter] ${message}`);
}

const ownReferences = [ReferenceKind.SCALAR, ReferenceKind.ONE_TO_MANY, ReferenceKind.EMBEDDED];

export function createAdapterUtils(orm: MikroORM): IAdapterUtils {
  const naming = orm.config.getNamingStrategy();
  const metadata = orm.getMetadata();

  const normalizeEntityName: IAdapterUtils["normalizeEntityName"] = (name) =>
    naming.getEntityName(naming.classToTableName(name));

  const getEntityMetadata: IAdapterUtils["getEntityMetadata"] = (entityName: string) => {
    entityName = normalizeEntityName(entityName);

    if (!metadata.has(entityName)) {
      createAdapterError(
        `Cannot find metadata for "${entityName}" entity. Make sure it defined and listed in your MikroORM config.`,
      );
    }

    return metadata.get(entityName);
  };

  function getPropertyMetadata(metadata: EntityMetadata, fieldName: string): EntityProperty {
    const prop = metadata.props.find((prop) => {
      if (ownReferences.includes(prop.kind) && prop.name === fieldName) {
        return true;
      }

      if (
        prop.kind === ReferenceKind.MANY_TO_ONE &&
        (prop.name === fieldName ||
          prop.fieldNames.includes(naming.propertyToColumnName(fieldName)))
      ) {
        return true;
      }

      return false;
    });

    if (!prop) {
      createAdapterError(`Can't find property "${fieldName}" on entity "${metadata.className}".`);
    }

    return prop;
  }

  function getReferencedColumnName(entityName: string, prop: EntityProperty) {
    if (ownReferences.includes(prop.kind)) {
      return prop.name;
    }

    if (prop.kind === ReferenceKind.MANY_TO_ONE) {
      return naming.columnNameToProperty(naming.joinColumnName(prop.name));
    }

    createAdapterError(
      `Reference kind ${prop.kind} is not supported. Defined in "${entityName}" entity for "${prop.name}" field.`,
    );
  }

  const getReferencedPropertyName = (metadata: EntityMetadata, prop: EntityProperty) =>
    getReferencedColumnName(metadata.className, prop);

  const getFieldPath: IAdapterUtils["getFieldPath"] = (
    metadata,
    fieldName,
    throwOnShadowProps = false,
  ) => {
    const prop = getPropertyMetadata(metadata, fieldName);

    if (prop.persist === false && throwOnShadowProps) {
      createAdapterError(
        `Cannot serialize "${fieldName}" into path, because it cannot be persisted in "${metadata.tableName}" table.`,
      );
    }

    if (prop.kind === ReferenceKind.SCALAR || prop.kind === ReferenceKind.EMBEDDED) {
      return [prop.name];
    }

    if (prop.kind === ReferenceKind.MANY_TO_ONE) {
      if (prop.referencedPKs.length > 1) {
        createAdapterError(
          `The "${fieldName}" field references to a table "${prop.name}" with complex primary key, which is not supported`,
        );
      }

      return [prop.name, naming.referenceColumnName()];
    }

    createAdapterError(
      `Cannot normalize "${fieldName}" field name into path for "${metadata.className}" entity.`,
    );
  };

  const normalizePropertyValue = (
    em: ReturnType<typeof orm.em.fork>,
    property: EntityProperty,
    value: unknown,
  ): unknown => {
    if (
      !property.targetMeta ||
      property.kind === ReferenceKind.SCALAR ||
      property.kind === ReferenceKind.EMBEDDED
    ) {
      return value;
    }

    return em.getReference(property.targetMeta.class, value);
  };

  const normalizeInput: IAdapterUtils["normalizeInput"] = (metadata, input, em) => {
    const fields: Record<string, any> = {};
    Object.entries(input).forEach(([key, value]) => {
      const property = getPropertyMetadata(metadata, key);
      const normalizedValue = em ? normalizePropertyValue(em, property, value) : value;

      dset(fields, [property.name], normalizedValue);
    });

    return fields;
  };

  const normalizeOutput: IAdapterUtils["normalizeOutput"] = (metadata, output) => {
    output = serialize(output);

    const result: Record<string, any> = {};
    Object.entries(output)
      .map(([key, value]) => ({
        path: getReferencedPropertyName(metadata, getPropertyMetadata(metadata, key)),
        value,
      }))
      .forEach(({ path, value }) => dset(result, path, value));

    return result;
  };

  function createWhereClause(
    path: Array<string | number>,
    value: unknown,
    op?: string,
    target: Record<string, any> = {},
  ): Record<string, any> {
    dset(target, op == null || op === "eq" ? path : path.concat(op), value);

    return target;
  }

  function createWhereInClause(
    fieldName: string,
    path: Array<string | number>,
    value: unknown,
    target?: Record<string, any>,
  ): Record<string, any> {
    if (!Array.isArray(value)) {
      createAdapterError(
        `The value for the field "${fieldName}" must be an array when using the $in operator.`,
      );
    }

    return createWhereClause(path, value, "$in", target);
  }

  const normalizeWhereClauses: IAdapterUtils["normalizeWhereClauses"] = (metadata, where) => {
    if (!where) {
      return {};
    }

    if (where.length === 1) {
      const [w] = where;

      if (!w) {
        return {};
      }

      const path = getFieldPath(metadata, w.field, true);

      switch (w.operator) {
        case "in":
          return createWhereInClause(w.field, path, w.value);
        case "contains":
          return createWhereClause(path, `%${w.value}%`, "$like");
        case "starts_with":
          return createWhereClause(path, `${w.value}%`, "$like");
        case "ends_with":
          return createWhereClause(path, `%${w.value}`, "$like");
        case "gt":
        case "gte":
        case "lt":
        case "lte":
        case "ne":
          return createWhereClause(path, w.value, `$${w.operator}`);
        default:
          return createWhereClause(path, w.value);
      }
    }

    const result: Record<string, any> = {};

    where
      .filter(({ connector }) => !connector || connector === "AND")
      .forEach(({ field, operator, value }, index) => {
        const path = ["$and", index].concat(getFieldPath(metadata, field, true));

        if (operator === "in") {
          return createWhereInClause(field, path, value, result);
        }

        return createWhereClause(path, value, "eq", result);
      });

    where
      .filter(({ connector }) => connector === "OR")
      .forEach(({ field, value }, index) => {
        const path = ["$or", index].concat(getFieldPath(metadata, field, true));

        return createWhereClause(path, value, "eq", result);
      });

    return result;
  };

  return {
    getEntityMetadata,
    normalizeEntityName,
    getFieldPath,
    normalizeInput,
    normalizeOutput,
    normalizeWhereClauses,
  };
}
