/**
 * Official RCMS Branches Idempotent Seed Script
 * Inserts / updates standard Robotics Club department branch records in Supabase
 */

import { db } from "@/db";

export const OFFICIAL_BRANCHES = [
  { code: "ECE", name: "Electronics and Communication Engineering" },
  { code: "CSE", name: "Computer Science and Engineering" },
  { code: "CSC", name: "Computer Science and Engineering (Cyber Security)" },
  { code: "CSM", name: "Computer Science and Engineering (Artificial Intelligence & Machine Learning)" },
  { code: "EEE", name: "Electrical and Electronics Engineering" },
  { code: "AIML", name: "Artificial Intelligence and Machine Learning" },
  { code: "AIDS", name: "Artificial Intelligence and Data Science" },
  { code: "IT", name: "Information Technology" },
  { code: "MECH", name: "Mechanical Engineering" },
  { code: "CIVIL", name: "Civil Engineering" },
  { code: "OTHER", name: "Other Department / General" },
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
