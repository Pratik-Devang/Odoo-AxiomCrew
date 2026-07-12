// @ts-nocheck
const { PrismaClient, UserRole, RecordStatus } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const departmentRows = [
  { name: "Finance", parent: null },
  { name: "Human Resources", parent: null },
  { name: "Procurement", parent: "Operations" },
  { name: "Security", parent: "Facilities" },
  { name: "Legal & Compliance", parent: null },
];

const userRows = [
  { name: "Nora Evans", email: "nora.evans@assetflow.local", role: UserRole.DEPARTMENT_HEAD, department: "Finance" },
  { name: "Owen Brooks", email: "owen.brooks@assetflow.local", role: UserRole.DEPARTMENT_HEAD, department: "Human Resources" },
  { name: "Grace Kim", email: "grace.kim@assetflow.local", role: UserRole.DEPARTMENT_HEAD, department: "Procurement" },
  { name: "Victor Stone", email: "victor.stone@assetflow.local", role: UserRole.ASSET_MANAGER, department: "Security" },
  { name: "Hannah Lee", email: "hannah.lee@assetflow.local", role: UserRole.EMPLOYEE, department: "Finance" },
  { name: "Arjun Mehta", email: "arjun.mehta@assetflow.local", role: UserRole.EMPLOYEE, department: "Finance" },
  { name: "Chloe Park", email: "chloe.park@assetflow.local", role: UserRole.EMPLOYEE, department: "Human Resources" },
  { name: "Diego Ramirez", email: "diego.ramirez@assetflow.local", role: UserRole.EMPLOYEE, department: "Procurement" },
  { name: "Farah Khan", email: "farah.khan@assetflow.local", role: UserRole.EMPLOYEE, department: "Procurement" },
  { name: "Ben Carter", email: "ben.carter@assetflow.local", role: UserRole.EMPLOYEE, department: "Security" },
  { name: "Leah Thompson", email: "leah.thompson@assetflow.local", role: UserRole.EMPLOYEE, department: "Legal & Compliance" },
  { name: "Ravi Nair", email: "ravi.nair@assetflow.local", role: UserRole.EMPLOYEE, department: "Legal & Compliance" },
];

const assignedAssets = [
  ["nora.evans@assetflow.local", "AF-0101", "Finance MacBook Air", "IT Equipment", "FIN-MBA-0101", "Finance - Desk 01"],
  ["owen.brooks@assetflow.local", "AF-0102", "HR Onboarding Laptop", "IT Equipment", "HR-LAP-0102", "HR - Desk 04"],
  ["grace.kim@assetflow.local", "AF-0103", "Procurement Tablet", "Electronics", "PROC-TAB-0103", "Procurement - Desk 02"],
  ["victor.stone@assetflow.local", "AF-0104", "Security Radio Kit", "Electronics", "SEC-RAD-0104", "Security Control Room"],
  ["hannah.lee@assetflow.local", "AF-0105", "Finance Dell Latitude", "IT Equipment", "FIN-DL-0105", "Finance - Desk 08"],
  ["arjun.mehta@assetflow.local", "AF-0106", "Budget Review Monitor", "IT Equipment", "FIN-MON-0106", "Finance - Desk 09"],
  ["chloe.park@assetflow.local", "AF-0107", "HR Badge Scanner", "Electronics", "HR-SCAN-0107", "HR Reception"],
  ["diego.ramirez@assetflow.local", "AF-0108", "Supplier Audit Laptop", "IT Equipment", "PROC-LAP-0108", "Procurement - Desk 07"],
  ["farah.khan@assetflow.local", "AF-0109", "Procurement Label Printer", "Electronics", "PROC-LBL-0109", "Procurement Store"],
  ["ben.carter@assetflow.local", "AF-0110", "Security Patrol Tablet", "Electronics", "SEC-TAB-0110", "Gatehouse"],
  ["leah.thompson@assetflow.local", "AF-0111", "Compliance Laptop", "IT Equipment", "LC-LAP-0111", "Legal - Desk 03"],
  ["ravi.nair@assetflow.local", "AF-0112", "Contract Review Monitor", "IT Equipment", "LC-MON-0112", "Legal - Desk 05"],
];

const bookableAssets = [
  ["AF-0121", "Finance War Room", "Facilities", "ROOM-FIN-0121", "Building A - Floor 4"],
  ["AF-0122", "HR Interview Room", "Facilities", "ROOM-HR-0122", "Building A - Floor 2"],
  ["AF-0123", "Procurement Pool Vehicle", "Vehicles", "VEH-PROC-0123", "Parking Bay P3"],
  ["AF-0124", "Security Briefing Room", "Facilities", "ROOM-SEC-0124", "Security Wing"],
];

const maintenanceRows = [
  ["nora.evans@assetflow.local", "AF-0101", "Battery health dropped below expected threshold during travel.", "MEDIUM", "IN_PROGRESS"],
  ["owen.brooks@assetflow.local", "AF-0102", "Keyboard has intermittent key repeats during onboarding sessions.", "LOW", "PENDING"],
  ["grace.kim@assetflow.local", "AF-0103", "Tablet screen protector cracked after supplier visit.", "LOW", "APPROVED"],
  ["victor.stone@assetflow.local", "AF-0104", "Two radios need range testing before night patrol.", "HIGH", "TECHNICIAN_ASSIGNED"],
  ["hannah.lee@assetflow.local", "AF-0105", "Docking station disconnects external display randomly.", "MEDIUM", "PENDING"],
  ["arjun.mehta@assetflow.local", "AF-0106", "Monitor flickers when switching spreadsheet dashboards.", "LOW", "RESOLVED"],
  ["chloe.park@assetflow.local", "AF-0107", "Badge scanner occasionally fails to read temporary visitor cards.", "MEDIUM", "IN_PROGRESS"],
  ["diego.ramirez@assetflow.local", "AF-0108", "VPN client fails on supplier audit network.", "HIGH", "APPROVED"],
  ["farah.khan@assetflow.local", "AF-0109", "Label printer alignment is drifting on asset labels.", "MEDIUM", "PENDING"],
  ["ben.carter@assetflow.local", "AF-0110", "Patrol tablet case latch is loose.", "LOW", "RESOLVED"],
  ["leah.thompson@assetflow.local", "AF-0111", "Laptop fan noise increased after long review session.", "LOW", "PENDING"],
  ["ravi.nair@assetflow.local", "AF-0112", "Monitor color calibration required for contract scans.", "LOW", "APPROVED"],
];

const bookingRows = [
  ["nora.evans@assetflow.local", "AF-0121", "UPCOMING", 24],
  ["owen.brooks@assetflow.local", "AF-0122", "COMPLETED", -48],
  ["grace.kim@assetflow.local", "AF-0123", "UPCOMING", 30],
  ["victor.stone@assetflow.local", "AF-0124", "ONGOING", -1],
  ["hannah.lee@assetflow.local", "AF-0121", "COMPLETED", -72],
  ["arjun.mehta@assetflow.local", "AF-0121", "UPCOMING", 52],
  ["chloe.park@assetflow.local", "AF-0122", "UPCOMING", 8],
  ["diego.ramirez@assetflow.local", "AF-0123", "COMPLETED", -24],
  ["farah.khan@assetflow.local", "AF-0123", "UPCOMING", 72],
  ["ben.carter@assetflow.local", "AF-0124", "COMPLETED", -96],
  ["leah.thompson@assetflow.local", "AF-0122", "UPCOMING", 12],
  ["ravi.nair@assetflow.local", "AF-0121", "COMPLETED", -120],
];

const transferRows = [
  ["nora.evans@assetflow.local", "hannah.lee@assetflow.local", "AF-0101", "REQUESTED"],
  ["owen.brooks@assetflow.local", "chloe.park@assetflow.local", "AF-0102", "APPROVED"],
  ["grace.kim@assetflow.local", "diego.ramirez@assetflow.local", "AF-0103", "REQUESTED"],
  ["victor.stone@assetflow.local", "ben.carter@assetflow.local", "AF-0104", "REJECTED"],
  ["hannah.lee@assetflow.local", "arjun.mehta@assetflow.local", "AF-0105", "APPROVED"],
  ["diego.ramirez@assetflow.local", "farah.khan@assetflow.local", "AF-0108", "REQUESTED"],
  ["leah.thompson@assetflow.local", "ravi.nair@assetflow.local", "AF-0111", "APPROVED"],
  ["ravi.nair@assetflow.local", "leah.thompson@assetflow.local", "AF-0112", "REQUESTED"],
];

async function firstOrCreate(model, where, data) {
  const found = await model.findFirst({ where });
  return found || model.create({ data });
}

async function main() {
  const passwordHash = await bcrypt.hash("Password123!", 12);

  for (const row of departmentRows) {
    await prisma.department.upsert({ where: { name: row.name }, update: { status: RecordStatus.ACTIVE }, create: { name: row.name, status: RecordStatus.ACTIVE } });
  }

  const allDepartments = await prisma.department.findMany({ select: { id: true, name: true } });
  const deptByName = Object.fromEntries(allDepartments.map((dept) => [dept.name, dept]));

  for (const row of departmentRows) {
    await prisma.department.update({ where: { name: row.name }, data: { parentDepartmentId: row.parent ? deptByName[row.parent]?.id ?? null : null } });
  }

  for (const row of userRows) {
    const department = deptByName[row.department];
    await prisma.user.upsert({
      where: { email: row.email },
      update: { name: row.name, role: row.role, departmentId: department.id, status: RecordStatus.ACTIVE },
      create: { name: row.name, email: row.email, passwordHash, role: row.role, departmentId: department.id, status: RecordStatus.ACTIVE },
    });
  }

  const users = await prisma.user.findMany({ where: { email: { in: userRows.map((row) => row.email) } } });
  const userByEmail = Object.fromEntries(users.map((user) => [user.email, user]));
  for (const [departmentName, email] of [["Finance", "nora.evans@assetflow.local"], ["Human Resources", "owen.brooks@assetflow.local"], ["Procurement", "grace.kim@assetflow.local"]]) {
    await prisma.department.update({ where: { name: departmentName }, data: { headId: userByEmail[email].id } });
  }

  const categoryNames = ["IT Equipment", "Electronics", "Facilities", "Vehicles"];
  const categories = await Promise.all(categoryNames.map((name) => prisma.assetCategory.upsert({ where: { name }, update: { status: RecordStatus.ACTIVE }, create: { name, status: RecordStatus.ACTIVE } })));
  const categoryByName = Object.fromEntries(categories.map((category) => [category.name, category]));

  await prisma.asset.deleteMany({ where: { tag: "AF-0199" } });

  for (const [email, tag, name, category, serialNumber, location] of assignedAssets) {
    const user = userByEmail[email];
    await prisma.asset.upsert({
      where: { tag },
      update: { name, categoryId: categoryByName[category].id, location, status: "ALLOCATED", currentHolderId: user.id, currentHolderDepartmentId: user.departmentId },
      create: { tag, name, categoryId: categoryByName[category].id, serialNumber, acquisitionDate: new Date("2025-05-01"), acquisitionCost: "1000.00", condition: "Good", location, isBookable: false, status: "ALLOCATED", currentHolderId: user.id, currentHolderDepartmentId: user.departmentId },
    });
  }

  for (const [tag, name, category, serialNumber, location] of bookableAssets) {
    await prisma.asset.upsert({
      where: { tag },
      update: { name, categoryId: categoryByName[category].id, location, isBookable: true, status: tag === "AF-0124" ? "RESERVED" : "AVAILABLE" },
      create: { tag, name, categoryId: categoryByName[category].id, serialNumber, acquisitionDate: new Date("2024-09-15"), acquisitionCost: "5000.00", condition: "Good", location, isBookable: true, status: tag === "AF-0124" ? "RESERVED" : "AVAILABLE" },
    });
  }

  const assets = await prisma.asset.findMany({ where: { tag: { in: [...assignedAssets.map((row) => row[1]), ...bookableAssets.map((row) => row[0])] } } });
  const assetByTag = Object.fromEntries(assets.map((asset) => [asset.tag, asset]));

  for (const [email, tag] of assignedAssets) {
    const user = userByEmail[email];
    const asset = assetByTag[tag];
    await firstOrCreate(prisma.allocation, { assetId: asset.id, employeeId: user.id, status: "ACTIVE" }, { assetId: asset.id, employeeId: user.id, departmentId: user.departmentId, allocatedAt: new Date("2026-04-01T09:00:00Z"), expectedReturnDate: new Date("2026-12-15T09:00:00Z"), status: "ACTIVE" });
    await firstOrCreate(prisma.allocation, { assetId: asset.id, employeeId: user.id, status: "RETURNED" }, { assetId: asset.id, employeeId: user.id, departmentId: user.departmentId, allocatedAt: new Date("2025-10-10T09:00:00Z"), expectedReturnDate: new Date("2026-01-15T09:00:00Z"), returnedAt: new Date("2026-01-12T16:30:00Z"), returnConditionNotes: "Returned during demo reassignment cycle.", status: "RETURNED" });
  }

  const now = Date.now();
  for (const [email, tag, status, offsetHours] of bookingRows) {
    const user = userByEmail[email];
    const asset = assetByTag[tag];
    const startTime = new Date(now + offsetHours * 60 * 60 * 1000);
    const endTime = new Date(startTime.getTime() + 90 * 60 * 1000);
    await firstOrCreate(prisma.booking, { assetId: asset.id, bookedById: user.id, status }, { assetId: asset.id, bookedById: user.id, startTime, endTime, status });
  }

  for (const [email, tag, issueDescription, priority, status] of maintenanceRows) {
    const user = userByEmail[email];
    const asset = assetByTag[tag];
    await firstOrCreate(prisma.maintenanceRequest, { assetId: asset.id, raisedById: user.id, status }, { assetId: asset.id, raisedById: user.id, issueDescription, priority, status, technicianName: ["TECHNICIAN_ASSIGNED", "IN_PROGRESS"].includes(status) ? "Demo Technician" : null, raisedAt: new Date("2026-06-01T10:00:00Z"), resolvedAt: status === "RESOLVED" ? new Date("2026-06-05T15:30:00Z") : null });
  }

  for (const [from, to, tag, status] of transferRows) {
    const fromEmployee = userByEmail[from];
    const toEmployee = userByEmail[to];
    const asset = assetByTag[tag];
    await firstOrCreate(prisma.transferRequest, { assetId: asset.id, fromEmployeeId: fromEmployee.id, toEmployeeId: toEmployee.id, status }, { assetId: asset.id, fromEmployeeId: fromEmployee.id, toEmployeeId: toEmployee.id, reason: "Demo reassignment request for department coverage.", status, requestedAt: new Date("2026-06-10T11:00:00Z"), decidedAt: status === "REQUESTED" ? null : new Date("2026-06-11T12:00:00Z"), decidedById: status === "REQUESTED" ? null : fromEmployee.id });
  }

  console.log("Verified demo data:", {
    af01Assets: await prisma.asset.count({ where: { tag: { startsWith: "AF-01" } } }),
    demoAllocations: await prisma.allocation.count({ where: { asset: { tag: { startsWith: "AF-01" } } } }),
    demoBookings: await prisma.booking.count({ where: { asset: { tag: { startsWith: "AF-01" } } } }),
    demoMaintenance: await prisma.maintenanceRequest.count({ where: { asset: { tag: { startsWith: "AF-01" } } } }),
    demoTransfers: await prisma.transferRequest.count({ where: { asset: { tag: { startsWith: "AF-01" } } } }),
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });