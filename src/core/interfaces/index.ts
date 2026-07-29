/**
 * RCMS Core Interfaces
 */

import { UUID, Nullable } from "../types";

export interface IEntity {
  id: UUID;
}

export interface ITimestampedEntity {
  createdAt: Date;
  updatedAt: Date;
}

export interface ISoftDelete {
  deletedAt: Nullable<Date>;
}

export interface IAuditableEntity extends IEntity, ITimestampedEntity, ISoftDelete {
  createdBy: UUID;
  updatedBy: UUID;
}
