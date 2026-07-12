// @ts-nocheck
const {
  PrismaClient,
  UserRole,
  RecordStatus,
  AssetStatus,
  AllocationStatus,
  BookingStatus,
  MaintenancePriority,
  MaintenanceStatus,
  TransferRequestStatus,
} = require("@prisma/client");
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

const categoryNames = ["Electronics", "Furniture", "Vehicles", "IT Equipment", "Facilities"];

const assignedAssetRows = [
  { tag: "AF-0101", name: "Finance MacBook Air", category: "IT Equipment", serialNumber: "FIN-MBA-0101", cost: "1350.00", condition: "Good", location: "Finance - Desk 01", email: "nora.evans@assetflow.local" },
  { tag: "AF-0102", name: "HR Onboarding Laptop", category: "IT Equipment", serialNumber: "HR-LAP-0102", cost: "1280.00", condition: "Good", location: "HR - Desk 04", email: "owen.brooks@assetflow.local" },
  { tag: "AF-0103", name: "Procurement Tablet", category: "Electronics", serialNumber: "PROC-TAB-0103", cost: "620.00", condition: "Good", location: "Procurement - Desk 02", email: "grace.kim@assetflow.local" },
  { tag: "AF-0104", name: "Security Radio Kit", category: "Electronics", serialNumber: "SEC-RAD-0104", cost: "890.00", condition: "Fair", location: "Security Control Room", email: "victor.stone@assetflow.local" },
  { tag: "AF-0105", name: "Finance Dell Latitude", category: "IT Equipment", serialNumber: "FIN-DL-0105", cost: "1420.00", condition: "Good", location: "Finance - Desk 08", email: "hannah.lee@assetflow.local" },
  { tag: "AF-0106", name: "Budget Review Monitor", category: "IT Equipment", serialNumber: "FIN-MON-0106", cost: "310.00", condition: "Good", location: "Finance - Desk 09", email: "arjun.mehta@assetflow.local" },
  { tag: "AF-0107", name: "HR Badge Scanner", category: "Electronics", serialNumber: "HR-SCAN-0107", cost: "450.00", condition: "Good", location: "HR Reception", email: "chloe.park@assetflow.local" },
  { tag: "AF-0108", name: "Supplier Audit Laptop", category: "IT Equipment", serialNumber: "PROC-LAP-0108", cost: "1510.00", condition: "Good", location: "Procurement - Desk 07", email: "diego.ramirez@assetflow.local" },
  { tag: "AF-0109", name: "Procurement Label Printer", category: "Electronics", serialNumber: "PROC-LBL-0109", cost: "520.00", condition: "Good", location: "Procurement Store", email: "farah.khan@assetflow.local" },
  { tag: "AF-0110", name: "Security Patrol Tablet", category: "Electronics", serialNumber: "SEC-TAB-0110", cost: "760.00", condition: "Fair", location: "Gatehouse", email: "ben.carter@assetflow.local" },
  { tag: "AF-0111", name: "Compliance Laptop", category: "IT Equipment", serialNumber: "LC-LAP-0111", cost: "1490.00", condition: "Good", location: "Legal - Desk 03", email: "leah.thompson@assetflow.local" },
  { tag: "AF-0112", name: "Contract Review Monitor", category: "IT Equipment", serialNumber: "LC-MON-0112", cost: "330.00", condition: "Good", location: "Legal - Desk 05", email: "ravi.nair@assetflow.local" },
];

const bookableAssetRows = [
  { tag: "AF-0121", name: "Finance War Room", category: "Facilities", serialNumber: "ROOM-FIN-0121", cost: "9800.00", condition: "Good", location: "Building A - Floor 4" },
  { tag: "AF-0122", name: "HR Interview Room", category: "Facilities", serialNumber: "ROOM-HR-0122", cost: "8400.00", condition: "Good", location: "Building A - Floor 2" },
  { tag: "AF-0123", name: "Procurement Pool Vehicle", category: "Vehicles", serialNumber: "VEH-PROC-0123", cost: "24500.00", condition: "Good", location: "Parking Bay P3" },
  { tag: "AF-0124", name: "Security Briefing Room", category: "Facilities", serialNumber: "ROOM-SEC-0124", cost: "7200.00", condition: "Good", location: "Security Wing" },
];

const maintenanceRows = [
  { email: "nora.evans@assetflow.local", assetTag: "AF-0101", issue: "Battery health dropped below expected threshold during travel.", priority: MaintenancePriority.MEDIUM, status: MaintenanceStatus.IN_PROGRESS },
  { email: "owen.brooks@assetflow.local", assetTag: "AF-0102", issue: "Keyboard has intermittent key repeats during onboarding sessions.", priority: MaintenancePriority.LOW, status: MaintenanceStatus.PENDING },
  { email: "grace.kim@assetflow.local", assetTag: "AF-0103", issue: "Tablet screen protector cracked after supplier visit.", priority: MaintenancePriority.LOW, status: MaintenanceStatus.APPROVED },
  { email: "victor.stone@assetflow.local", assetTag: "AF-0104", issue: "Two radios need range testing before night patrol.", priority: MaintenancePriority.HIGH, status: MaintenanceStatus.TECHNICIAN_ASSIGNED },
  { email: "hannah.lee@assetflow.local", assetTag: "AF-0105", issue: "Docking station disconnects external display randomly.", priority: MaintenancePriority.MEDIUM, status: MaintenanceStatus.PENDING },
  { email: "arjun.mehta@assetflow.local", assetTag: "AF-0106", issue: "Monitor flickers when switching spreadsheet dashboards.", priority: MaintenancePriority.LOW, status: MaintenanceStatus.RESOLVED },
  { email: "chloe.park@assetflow.local", assetTag: "AF-0107", issue: "Badge scanner occasionally fails to read temporary visitor cards.", priority: MaintenancePriority.MEDIUM, status: MaintenanceStatus.IN_PROGRESS },
  { email: "diego.ramirez@assetflow.local", assetTag: "AF-0108", issue: "VPN client fails on supplier audit network.", priority: MaintenancePriority.HIGH, status: MaintenanceStatus.APPROVED },
  { email: "farah.khan@assetflow.local", assetTag: "AF-0109", issue: "Label printer alignment is drifting on asset labels.", priority: MaintenancePriority.MEDIUM, status: MaintenanceStatus.PENDING },
  { email: "ben.carter@assetflow.local", assetTag: "AF-0110", issue: "Patrol tablet case latch is loose.", priority: MaintenancePriority.LOW, status: MaintenanceStatus.RESOLVED },
  { email: "leah.thompson@assetflow.local", assetTag: "AF-0111", issue: "Laptop fan noise increased after long review session.", priority: MaintenancePriority.LOW, status: MaintenanceStatus.PENDING },
  { email: "ravi.nair@assetflow.local", assetTag: "AF-0112", issue: "Monitor color calibration required for contract scans.", priority: MaintenancePriority.LOW, status: MaintenanceStatus.APPROVED },
];

const bookingRows = [
  { email: "nora.evans@assetflow.local", assetTag: "AF-0121", status: BookingStatus.UPCOMING, offsetHours: 24 },
  { email: "owen.brooks@assetflow.local", assetTag: "AF-0122", status: BookingStatus.COMPLETED, offsetHours: -48 },
  { email: "grace.kim@assetflow.local", assetTag: "AF-0123", status: BookingStatus.UPCOMING, offsetHours: 30 },
  { email: "victor.stone@assetflow.local", assetTag: "AF-0124", status: BookingStatus.ONGOING, offsetHours: -1 },
  { email: "hannah.lee@assetflow.local", assetTag: "AF-0121", status: BookingStatus.COMPLETED, offsetHours: -72 },
  { email: "arjun.mehta@assetflow.local", assetTag: "AF-0121", status: BookingStatus.UPCOMING, offsetHours: 52 },
  { email: "chloe.park@assetflow.local", assetTag: "AF-0122", status: BookingStatus.UPCOMING, offsetHours: 8 },
  { email: "diego.ramirez@assetflow.local", assetTag: "AF-0123", status: BookingStatus.COMPLETED, offsetHours: -24 },
  { email: "farah.khan@assetflow.local", assetTag: "AF-0123", status: BookingStatus.UPCOMING, offsetHours: 72 },
  { email: "ben.carter@assetflow.local", assetTag: "AF-0124", status: BookingStatus.COMPLETED, offsetHours: -96 },
  { email: "leah.thompson@assetflow.local", assetTag: "AF-0122", status: BookingStatus.UPCOMING, offsetHours: 12 },
  { email: "ravi.nair@assetflow.local", assetTag: "AF-0121", status: BookingStatus.COMPLETED, offsetHours: -120 },
];

const transferRows = [
  { from: "nora.evans@assetflow.local", to: "hannah.lee@assetflow.local", assetTag: "AF-0101", status: TransferRequestStatus.REQUESTED },
  { from: "owen.brooks@assetflow.local", to: "chloe.park@assetflow.local", assetTag: "AF-0102", status: TransferRequestStatus.APPROVED },
  { from: "grace.kim@assetflow.local", to: "diego.ramirez@assetflow.local", assetTag: "AF-0103", status: TransferRequestStatus.REQUESTED },
  { from: "victor.stone@assetflow.local", to: "ben.carter@assetflow.local", assetTag: "AF-0104", status: TransferRequestStatus.REJECTED },
  { from: "hannah.lee@assetflow.local", to: "arjun.mehta@assetflow.local", assetTag: "AF-0105", status: TransferRequestStatus.APPROVED },
  { from: "diego.ramirez@assetflow.local", to: "farah.khan@assetflow.local", assetTag: "AF-0108", status: TransferRequestStatus.REQUESTED },
  { from: "leah.thompson@assetflow.local", to: "ravi.nair@assetflow.local", assetTag: "AF-0111", status: TransferRequestStatus.APPROVED },
  { from: "ravi.nair@assetflow.local", to: "leah.thompson@assetflow.local", assetTag: "AF-0112", status: TransferRequestStatus.REQUESTED },
];

async function upsertCategory(name) {
  return prisma.assetCategory.upsert({
    where: { name },
    update: { status: RecordStatus.ACTIVE },
    create: { name, status: RecordStatus.ACTIVE },
  });
}

async function createIfMissing(model, where, data) {
  const existing = await model.findFirst({ where });
  if (existing) return existing;
  return model.create({ data });
}

async function main() {
  const passwordHash = await bcrypt.hash("Password123!", 12);

  for (const row of departmentRows) {
    await prisma.department.upsert({
      where: { name: row.name },
      update: { status: RecordStatus.ACTIVE },
      create: { name: row.name, status: RecordStatus.ACTIVE },
    });
  }

  const departments = await prisma.department.findMany({
    where: { name: { in: [...departmentRows.map((row) => row.name), "Operations", "Facilities"] } },
    select: { id: true, name: true },
  });
  const departmentByName = Object.fromEntries(departments.map((department) => [department.name, department]));

  for (const row of departmentRows) {
    const department = departmentByName[row.name];
    const parent = row.parent ? departmentByName[row.parent] : null;
    if (!department) continue;

    await prisma.department.update({
      where: { id: department.id },
      data: { parentDepartmentId: parent?.id ?? null, status: RecordStatus.ACTIVE },
    });
  }

  const users = [];
  for (const row of userRows) {
    const department = departmentByName[row.department];
    if (!department) throw new Error(`Missing department: ${row.department}`);

    const user = await prisma.user.upsert({
      where: { email: row.email },
      update: {
        name: row.name,
        role: row.role,
        departmentId: department.id,
        status: RecordStatus.ACTIVE,
      },
      create: {
        name: row.name,
        email: row.email,
        passwordHash,
        role: row.role,
        departmentId: department.id,
        status: RecordStatus.ACTIVE,
      },
    });
    users.push(user);
  }

  const userByEmail = Object.fromEntries(users.map((user) => [user.email, user]));
  const headAssignments = [
    { department: "Finance", email: "nora.evans@assetflow.local" },
    { department: "Human Resources", email: "owen.brooks@assetflow.local" },
    { department: "Procurement", email: "grace.kim@assetflow.local" },
  ];

  for (const assignment of headAssignments) {
    const department = departmentByName[assignment.department];
    const head = userByEmail[assignment.email];
    if (!department || !head) continue;

    await prisma.department.update({
      where: { id: department.id },
      data: { headId: head.id },
    });
  }

  const categories = await Promise.all(categoryNames.map(upsertCategory));
  const categoryByName = Object.fromEntries(categories.map((category) => [category.name, category]));

  for (const row of assignedAssetRows) {
    const user = userByEmail[row.email];
    const department = user ? departments.find((dept) => dept.id === user.departmentId) : null;
    const category = categoryByName[row.category];
    if (!user || !category) continue;

    await prisma.asset.upsert({
      where: { tag: row.tag },
      update: {
        name: row.name,
        categoryId: category.id,
        location: row.location,
        condition: row.condition,
        status: AssetStatus.ALLOCATED,
        currentHolderId: user.id,
        currentHolderDepartmentId: user.departmentId,
      },
      create: {
        tag: row.tag,
        name: row.name,
        categoryId: category.id,
        serialNumber: row.serialNumber,
        acquisitionDate: new Date("2025-05-01"),
        acquisitionCost: row.cost,
        condition: row.condition,
        location: row.location,
        isBookable: false,
        status: AssetStatus.ALLOCATED,
        currentHolderId: user.id,
        currentHolderDepartmentId: user.departmentId,
      },
    });
  }

  for (const row of bookableAssetRows) {
    const category = categoryByName[row.category];
    if (!category) continue;

    await prisma.asset.upsert({
      where: { tag: row.tag },
      update: {
        name: row.name,
        categoryId: category.id,
        location: row.location,
        condition: row.condition,
        isBookable: true,
        status: row.tag === "AF-0124" ? AssetStatus.RESERVED : AssetStatus.AVAILABLE,
      },
      create: {
        tag: row.tag,
        name: row.name,
        categoryId: category.id,
        serialNumber: row.serialNumber,
        acquisitionDate: new Date("2024-09-15"),
        acquisitionCost: row.cost,
        condition: row.condition,
        location: row.location,
        isBookable: true,
        status: row.tag === "AF-0124" ? AssetStatus.RESERVED : AssetStatus.AVAILABLE,
      },
    });
  }

  const assets = await prisma.asset.findMany({
    where: { tag: { in: [...assignedAssetRows.map((row) => row.tag), ...bookableAssetRows.map((row) => row.tag)] } },
  });
  const assetByTag = Object.fromEntries(assets.map((asset) => [asset.tag, asset]));
  const now = new Date();

  for (const row of assignedAssetRows) {
    const user = userByEmail[row.email];
    const asset = assetByTag[row.tag];
    if (!user || !asset) continue;

    await createIfMissing(
      prisma.allocation,
      { assetId: asset.id, employeeId: user.id, status: AllocationStatus.ACTIVE },
      {
        assetId: asset.id,
        employeeId: user.id,
        departmentId: user.departmentId,
        allocatedAt: new Date("2026-04-01T09:00:00Z"),
        expectedReturnDate: new Date("2026-12-15T09:00:00Z"),
        status: AllocationStatus.ACTIVE,
      },
    );

    await createIfMissing(
      prisma.allocation,
      { assetId: asset.id, employeeId: user.id, status: AllocationStatus.RETURNED },
      {
        assetId: asset.id,
        employeeId: user.id,
        departmentId: user.departmentId,
        allocatedAt: new Date("2025-10-10T09:00:00Z"),
        expectedReturnDate: new Date("2026-01-15T09:00:00Z"),
        returnedAt: new Date("2026-01-12T16:30:00Z"),
        returnConditionNotes: "Returned during demo reassignment cycle.",
        status: AllocationStatus.RETURNED,
      },
    );
  }

  for (const row of bookingRows) {
    const user = userByEmail[row.email];
    const asset = assetByTag[row.assetTag];
    if (!user || !asset) continue;

    const startTime = new Date(now.getTime() + row.offsetHours * 60 * 60 * 1000);
    const endTime = new Date(startTime.getTime() + 90 * 60 * 1000);
    await createIfMissing(
      prisma.booking,
      { assetId: asset.id, bookedById: user.id, status: row.status },
      { assetId: asset.id, bookedById: user.id, startTime, endTime, status: row.status },
    );
  }

  for (const row of maintenanceRows) {
    const user = userByEmail[row.email];
    const asset = assetByTag[row.assetTag];
    if (!user || !asset) continue;

    await createIfMissing(
      prisma.maintenanceRequest,
      { assetId: asset.id, raisedById: user.id, status: row.status },
      {
        assetId: asset.id,
        raisedById: user.id,
        issueDescription: row.issue,
        priority: row.priority,
        status: row.status,
        technicianName: row.status === MaintenanceStatus.TECHNICIAN_ASSIGNED || row.status === MaintenanceStatus.IN_PROGRESS ? "Demo Technician" : null,
        raisedAt: new Date("2026-06-01T10:00:00Z"),
        resolvedAt: row.status === MaintenanceStatus.RESOLVED ? new Date("2026-06-05T15:30:00Z") : null,
      },
    );
  }

  for (const row of transferRows) {
    const fromEmployee = userByEmail[row.from];
    const toEmployee = userByEmail[row.to];
    const asset = assetByTag[row.assetTag];
    if (!fromEmployee || !toEmployee || !asset) continue;

    await createIfMissing(
      prisma.transferRequest,
      { assetId: asset.id, fromEmployeeId: fromEmployee.id, toEmployeeId: toEmployee.id, status: row.status },
      {
        assetId: asset.id,
        fromEmployeeId: fromEmployee.id,
        toEmployeeId: toEmployee.id,
        reason: "Demo reassignment request for department coverage.",
        status: row.status,
        requestedAt: new Date("2026-06-10T11:00:00Z"),
        decidedAt: row.status === TransferRequestStatus.REQUESTED ? null : new Date("2026-06-11T12:00:00Z"),
        decidedById: row.status === TransferRequestStatus.REQUESTED ? null : fromEmployee.id,
      },
    );
  }

  console.log("Added/updated 5 departments, 12 users, 16 assets, and rich employee demo activity without deleting existing data.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });