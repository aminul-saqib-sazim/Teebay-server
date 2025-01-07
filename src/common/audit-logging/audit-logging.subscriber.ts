import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { ChangeSet, ChangeSetType, EventSubscriber, FlushEventArgs } from "@mikro-orm/core";

import { EAuditAction } from "@/common/enums/audit.enums";

import { AuditLog } from "../entities/audit-logs.entity";
import { CHANGE_SET_TYPES_TO_PROCESS } from "./audit-logging.constants";

@Injectable()
export class AuditLoggingSubscriber<T extends object> implements EventSubscriber<T> {
  protected readonly logger = new Logger(this.constructor.name);

  constructor(protected readonly configService: ConfigService) {}

  private getChangeSetType(changeSet: ChangeSet<Partial<T>>): EAuditAction | null {
    switch (changeSet.type) {
      case ChangeSetType.CREATE:
        return EAuditAction.CREATE;
      case ChangeSetType.UPDATE:
      case ChangeSetType.UPDATE_EARLY:
        return EAuditAction.UPDATE;
      case ChangeSetType.DELETE:
      case ChangeSetType.DELETE_EARLY:
        return EAuditAction.DELETE;
      default:
        return null;
    }
  }

  onFlush(args: FlushEventArgs): void {
    const isAuditLoggingEnabled = this.configService.get<boolean>("ENABLE_AUDIT_LOGGING");

    if (!isAuditLoggingEnabled) {
      this.logger.log("Audit logging is disabled");
      return;
    }

    const changeSetsFromUnitOfWork = args.uow.getChangeSets();
    const changeSetsForEntity: Array<ChangeSet<Partial<T>>> = changeSetsFromUnitOfWork.filter(
      (changeSet) => CHANGE_SET_TYPES_TO_PROCESS.includes(changeSet.type),
    );

    if (!changeSetsForEntity.length) {
      this.logger.log("No change sets found, skipping audit logging");
      return;
    }

    for (let index = 0; index < changeSetsForEntity.length; index++) {
      const currentChangeSet = changeSetsForEntity[index];

      if (!currentChangeSet.entity) continue;

      const auditEntry = new AuditLog();

      const changeSetType = this.getChangeSetType(currentChangeSet);

      if (!changeSetType) {
        this.logger.error("Invalid change set type", {
          changeSetType: currentChangeSet.type,
          entity: currentChangeSet.entity.constructor.name,
        });
        continue;
      }

      auditEntry.actionType = changeSetType;
      auditEntry.entityName = currentChangeSet.entity.constructor.name;

      if ([EAuditAction.UPDATE, EAuditAction.DELETE].includes(changeSetType)) {
        auditEntry.previousState = currentChangeSet.originalEntity ?? {};

        auditEntry.currentState = currentChangeSet.payload;

        if (
          "updatedBy" in currentChangeSet.entity &&
          typeof currentChangeSet.entity.updatedBy === "object" &&
          !!currentChangeSet.entity.updatedBy &&
          "id" in currentChangeSet.entity.updatedBy &&
          typeof currentChangeSet.entity.updatedBy.id === "number"
        ) {
          auditEntry.actorId = currentChangeSet.entity.updatedBy.id;
        }
      } else {
        auditEntry.currentState = currentChangeSet.payload;

        if (
          "createdBy" in currentChangeSet.entity &&
          typeof currentChangeSet.entity.createdBy === "object" &&
          !!currentChangeSet.entity.createdBy &&
          "id" in currentChangeSet.entity.createdBy &&
          typeof currentChangeSet.entity.createdBy.id === "number"
        ) {
          auditEntry.actorId = currentChangeSet.entity.createdBy.id;
        }
      }

      if (!auditEntry.actorId) {
        this.logger.warn("Actor not found", {
          entity: currentChangeSet.entity.constructor.name,
          entityId: "id" in currentChangeSet.entity ? currentChangeSet.entity["id"] : undefined,
        });
      }

      args.uow.computeChangeSet(auditEntry);
      args.uow.recomputeSingleChangeSet(currentChangeSet.entity);
    }
  }
}
