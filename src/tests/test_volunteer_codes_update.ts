import * as fs from "fs";
import * as path from "path";

const envLocalPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envLocalPath)) {
  const content = fs.readFileSync(envLocalPath, "utf-8");
  content.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const idx = trimmed.indexOf("=");
      if (idx > 0) {
        const key = trimmed.substring(0, idx).trim();
        const value = trimmed.substring(idx + 1).trim();
        process.env[key] = value;
      }
    }
  });
}

async function main() {
  const { db } = await import("../db");
  const { VolunteerCodesRepository } = await import("../repositories/attendance/volunteer_codes.repository");
  const { VolunteerCodesService } = await import("../services/attendance/volunteer_codes.service");
  const { AttendanceSessionsRepository } = await import("../repositories/attendance/attendance_sessions.repository");

  const sessionsRepo = new AttendanceSessionsRepository();
  const codesRepo = new VolunteerCodesRepository();
  const service = new VolunteerCodesService(codesRepo, sessionsRepo);

  const session = await sessionsRepo.findAll({ page: 1, limit: 1 });
  const sessId = session.items[0].id;

  console.log("Generating code for session:", sessId);
  const code = await service.generateCode(sessId, 4);
  console.log("Generated code:", code);

  console.log("Validating code with dummy actor ID...");
  try {
    const validated = await service.validateCode(code.code, "00000000-0000-0000-0000-000000000001");
    console.log("Validated successfully:", validated);
  } catch (err: any) {
    console.error("Validation error:", err.message);
  }
}

main();
