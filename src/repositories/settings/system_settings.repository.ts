/**
 * Settings Domain - System Settings Repository Implementation
 */

import { db, toCamelCase } from "@/db";
import { systemSettings, SystemSettingSelect } from "@/db/schema";
import { UUID } from "@/core/types";

export class SystemSettingsRepository {
  private tableName = "system_settings";

  public async getByKey(key: string): Promise<SystemSettingSelect | null> {
    const { data, error } = await db
      .from(this.tableName)
      .select("*")
      .eq("key", key)
      .single();

    if (error || !data) return null;
    return toCamelCase<SystemSettingSelect>(data);
  }

  public async getAll(): Promise<SystemSettingSelect[]> {
    const { data, error } = await db.from(this.tableName).select("*");
    if (error || !data) return [];
    return toCamelCase<SystemSettingSelect[]>(data);
  }

  public async upsert(key: string, value: string, description?: string, updatedBy?: UUID): Promise<SystemSettingSelect> {
    const payload = {
      key,
      value,
      description: description || null,
      updated_at: new Date().toISOString(),
      updated_by: updatedBy || null,
    };

    const { data, error } = await db
      .from(this.tableName)
      .upsert(payload, { onConflict: "key" })
      .select()
      .single();

    if (error || !data) {
      throw new Error(`[SystemSettingsRepository] Upsert failed for key ${key}: ${error?.message}`);
    }

    return toCamelCase<SystemSettingSelect>(data);
  }
}
