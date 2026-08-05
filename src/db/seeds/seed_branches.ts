/**
 * Official RCMS Branches Idempotent Seed Script
 * Inserts / updates standard Robotics Club department branch records in Supabase
 */

import { db } from "@/db";

import { RCMS_BRANCHES } from "@/constants/branches";

export const OFFICIAL_BRANCHES = [
  { code: "CSE", name: "Computer Science and Engineering" },
  { code: "CSM", name: "Computer Science and Engineering (AI & ML)" },
  { code: "CSD", name: "Computer Science and Engineering (Data Science)" },
  { code: "CSC", name: "Computer Science and Engineering (Cyber Security)" },
  { code: "IT", name: "Information Technology" },
  { code: "ECE", name: "Electronics and Communication Engineering" },
  { code: "EEE", name: "Electrical and Electronics Engineering" },
  { code: "MEC", name: "Mechanical Engineering" },
  { code: "Civil", name: "Civil Engineering" },
  { code: "MBA", name: "Master of Business Administration" },
  { code: "MCA", name: "Master of Computer Applications" },
];

export async function seedOfficialBranches() {
  console.log("🌱 Seeding Official RCMS Branches...");

  // Fetch existing branches from database
  const { data: existingBranches } = await db.from("branches").select("id, code, name");
  const existingMap = new Map<string, any>();
  if (existingBranches) {
    (existingBranches as any[]).forEach((b: any) => {
      if (b.code) existingMap.set(b.code.toUpperCase(), b);
    });
  }

  let insertedCount = 0;
  let updatedCount = 0;

  for (const branch of OFFICIAL_BRANCHES) {
    const existing = existingMap.get(branch.code);
    if (!existing) {
      const { error } = await db.from("branches").insert({
        code: branch.code,
        name: branch.name,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: null,
        updated_by: null,
        version: 1,
      });
      if (error) {
        console.error(`Failed to insert branch ${branch.code}:`, error.message);
      } else {
        insertedCount++;
      }
    } else {
      const { error } = await db
        .from("branches")
        .update({
          name: branch.name,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
      if (error) {
        console.error(`Failed to update branch ${branch.code}:`, error.message);
      } else {
        updatedCount++;
      }
    }
  }

  console.log(`✅ Official Branches Seeded Successfully! Inserted: ${insertedCount}, Updated: ${updatedCount}, Total: ${OFFICIAL_BRANCHES.length}`);
}
