/**
 * Production Data Initialization Seed Script
 * Populates RCMS database with realistic Robotics Club operational data
 */

import { db } from "@/db";
import {
  branches,
  academicYears,
  semesters,
  members,
  attendanceSessions,
  attendanceRecords,
  tasks,
  events,
  inventoryItems,
  sponsors,
  budgets,
  financialTransactions,
  pointRules,
  notifications,
} from "@/db/schema";

export async function seedProductionData() {
  console.log("🌱 Starting RCMS Production Data Initialization...");

  const creatorId = "00000000-0000-0000-0000-000000000001";

  // 1. Branches & Academic Structure
  const branchList = await db
    .insert(branches)
    .values([
      { name: "Robotics & Automation", code: "RA", createdBy: creatorId, updatedBy: creatorId },
      { name: "Computer Science Engineering", code: "CSE", createdBy: creatorId, updatedBy: creatorId },
      { name: "Electrical Engineering", code: "EE", createdBy: creatorId, updatedBy: creatorId },
      { name: "Mechanical Engineering", code: "ME", createdBy: creatorId, updatedBy: creatorId },
    ])
    .returning();

  const acadYear = await db
    .insert(academicYears)
    .values({
      year: "2025-2026",
      startDate: new Date("2025-08-01"),
      endDate: new Date("2026-05-31"),
      isCurrent: true,
      createdBy: creatorId,
      updatedBy: creatorId,
    })
    .returning();

  const semester = await db
    .insert(semesters)
    .values({
      academicYearId: acadYear[0].id,
      name: "Spring 2026",
      startDate: new Date("2026-01-05"),
      endDate: new Date("2026-05-20"),
      isCurrent: true,
      createdBy: creatorId,
      updatedBy: creatorId,
    })
    .returning();

  // 2. Members
  const memberList = await db
    .insert(members)
    .values([
      {
        name: "Alice Smith (President)",
        email: "president@robotics.org",
        phone: "9876543201",
        rollNumber: "26RC1001",
        branchId: branchList[0].id,
        status: "active",
      },
      {
        name: "Bob Johnson (Vice President)",
        email: "vp@robotics.org",
        phone: "9876543202",
        rollNumber: "26RC1002",
        branchId: branchList[1].id,
        status: "active",
      },
      {
        name: "Charlie Engineer",
        email: "charlie@robotics.org",
        phone: "9876543203",
        rollNumber: "26RC1003",
        branchId: branchList[0].id,
        status: "active",
      },
      {
        name: "David Scoring",
        email: "david@robotics.org",
        phone: "9876543204",
        rollNumber: "26RC1004",
        branchId: branchList[2].id,
        status: "active",
      },
      {
        name: "Eve Hardware",
        email: "eve@robotics.org",
        phone: "9876543205",
        rollNumber: "26RC1005",
        branchId: branchList[3].id,
        status: "active",
      },
    ])
    .returning();

  // 3. Attendance Sessions & Records
  const session = await db
    .insert(attendanceSessions)
    .values({
      title: "Spring 2026 Orientation & Hands-on Robotics",
      code: "ATT-2026-01",
      status: "open",
      location: "Lab 3, Robotics Complex",
      createdBy: creatorId,
    })
    .returning();

  await db.insert(attendanceRecords).values([
    {
      sessionId: session[0].id,
      memberId: memberList[0].id,
      status: "present",
      volunteerUser: creatorId,
    },
    {
      sessionId: session[0].id,
      memberId: memberList[1].id,
      status: "present",
      volunteerUser: creatorId,
    },
  ]);

  // 4. Tasks & Events
  await db.insert(tasks).values([
    {
      title: "Assemble Line Follower Chassis",
      category: "Hardware",
      points: 15,
      status: "active",
      createdBy: creatorId,
      updatedBy: creatorId,
    },
    {
      title: "Calibrate Ultrasonic Sensors",
      category: "Software",
      points: 20,
      status: "active",
      createdBy: creatorId,
      updatedBy: creatorId,
    },
  ]);

  await db.insert(events).values([
    {
      name: "3D Printing & CAD Workshop",
      startDate: new Date("2026-08-15T09:00:00Z"),
      endDate: new Date("2026-08-15T12:00:00Z"),
      points: 30,
      status: "published",
      venue: "CAD Lab 2",
      createdBy: creatorId,
      updatedBy: creatorId,
    },
    {
      name: "RoboWars 2026 Annual Hackathon",
      startDate: new Date("2026-09-01T10:00:00Z"),
      endDate: new Date("2026-09-01T18:00:00Z"),
      points: 50,
      status: "published",
      venue: "Main Auditorium",
      createdBy: creatorId,
      updatedBy: creatorId,
    },
  ]);

  // 5. Inventory Items
  await db.insert(inventoryItems).values([
    {
      name: "Arduino Uno R3 Board",
      category: "microcontrollers",
      quantity: 10,
      available: 8,
      location: "Cabinet A-1",
      createdBy: creatorId,
      updatedBy: creatorId,
    },
    {
      name: "Raspberry Pi 4 Model B (4GB)",
      category: "microcontrollers",
      quantity: 5,
      available: 4,
      location: "Cabinet A-2",
      createdBy: creatorId,
      updatedBy: creatorId,
    },
    {
      name: "HC-SR04 Ultrasonic Distance Sensor",
      category: "sensors",
      quantity: 20,
      available: 18,
      location: "Bin S-3",
      createdBy: creatorId,
      updatedBy: creatorId,
    },
    {
      name: "NEMA 17 Stepper Motor",
      category: "motors",
      quantity: 12,
      available: 10,
      location: "Bin M-1",
      createdBy: creatorId,
      updatedBy: creatorId,
    },
  ]);

  // 6. Finance Data
  const sponsorList = await db
    .insert(sponsors)
    .values({
      name: "RoboCorp Innovations Ltd",
      type: "industry_partner",
      contactEmail: "sponsorships@robocorp.org",
      contactPhone: "9876543999",
      status: "active",
      createdBy: creatorId,
      updatedBy: creatorId,
    })
    .returning();

  const budgetList = await db
    .insert(budgets)
    .values({
      name: "Annual Hardware & Components Fund 2026",
      category: "equipment",
      allocatedAmount: 150000,
      utilizedAmount: 25000,
      createdBy: creatorId,
      updatedBy: creatorId,
    })
    .returning();

  await db.insert(financialTransactions).values([
    {
      type: "income",
      amount: 150000,
      referenceType: "sponsors",
      referenceId: sponsorList[0].id,
      createdBy: creatorId,
      remarks: "Sponsorship grant from RoboCorp Innovations",
    },
    {
      type: "expense",
      amount: 25000,
      referenceType: "budgets",
      referenceId: budgetList[0].id,
      createdBy: creatorId,
      remarks: "Purchased initial microcontroller stock and sensors",
    },
  ]);

  // 7. Point Rules & Notifications
  await db.insert(pointRules).values({
    trigger: "attendance_marked",
    category: "attendance",
    points: 10,
    description: "Points awarded for attending official session",
    createdBy: creatorId,
    updatedBy: creatorId,
  });

  await db.insert(notifications).values({
    recipientId: memberList[0].id,
    title: "Welcome to Robotics Club Portal",
    message: "Your member profile has been initialized with Super Admin access.",
    channel: "in_app",
    status: "delivered",
    createdBy: creatorId,
  });

  console.log("✅ RCMS Production Data Initialization Completed Successfully!");
}
