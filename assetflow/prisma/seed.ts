import type { Asset, AssetCategory } from "@prisma/client";

const {
  PrismaClient,
  UserRole,
  RecordStatus,
  AssetStatus,
  AllocationStatus,
  BookingStatus,
  MaintenancePriority,
  MaintenanceStatus,
  AuditCycleStatus,
  AuditVerification,
} = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  await prisma.notification.deleteMany();
  await prisma.auditItem.deleteMany();
  await prisma.auditAuditor.deleteMany();
  await prisma.auditCycle.deleteMany();
  await prisma.maintenanceRequest.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.transferRequest.deleteMany();
  await prisma.allocation.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.assetCategory.deleteMany();
  await prisma.department.updateMany({ data: { headId: null, parentDepartmentId: null } });
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();

  const operations = await prisma.department.create({
    data: { name: "Operations", status: RecordStatus.ACTIVE },
  });
  const technology = await prisma.department.create({
    data: { name: "Technology", status: RecordStatus.ACTIVE },
  });
  const facilities = await prisma.department.create({
    data: {
      name: "Facilities",
      status: RecordStatus.ACTIVE,
      parentDepartmentId: operations.id,
    },
  });

  const passwordHash = await bcrypt.hash("Password123!", 12);
  const users = await Promise.all([
    prisma.user.create({
      data: {
        name: "Avery Admin",
        email: "admin@assetflow.local",
        passwordHash,
        role: UserRole.ADMIN,
        status: RecordStatus.ACTIVE,
      },
    }),
    prisma.user.create({
      data: {
        name: "Priya Shah",
        email: "priya.shah@assetflow.local",
        passwordHash,
        role: UserRole.DEPARTMENT_HEAD,
        departmentId: technology.id,
        status: RecordStatus.ACTIVE,
      },
    }),
    prisma.user.create({
      data: {
        name: "Marcus Reed",
        email: "marcus.reed@assetflow.local",
        passwordHash,
        role: UserRole.DEPARTMENT_HEAD,
        departmentId: operations.id,
        status: RecordStatus.ACTIVE,
      },
    }),
    prisma.user.create({
      data: {
        name: "Elena Torres",
        email: "elena.torres@assetflow.local",
        passwordHash,
        role: UserRole.ASSET_MANAGER,
        departmentId: operations.id,
        status: RecordStatus.ACTIVE,
      },
    }),
    prisma.user.create({
      data: {
        name: "Noah Williams",
        email: "noah.williams@assetflow.local",
        passwordHash,
        role: UserRole.ASSET_MANAGER,
        departmentId: technology.id,
        status: RecordStatus.ACTIVE,
      },
    }),
    prisma.user.create({
      data: {
        name: "Mia Chen",
        email: "mia.chen@assetflow.local",
        passwordHash,
        role: UserRole.EMPLOYEE,
        departmentId: technology.id,
        status: RecordStatus.ACTIVE,
      },
    }),
    prisma.user.create({
      data: {
        name: "Liam Patel",
        email: "liam.patel@assetflow.local",
        passwordHash,
        role: UserRole.EMPLOYEE,
        departmentId: technology.id,
        status: RecordStatus.ACTIVE,
      },
    }),
    prisma.user.create({
      data: {
        name: "Sofia Martinez",
        email: "sofia.martinez@assetflow.local",
        passwordHash,
        role: UserRole.EMPLOYEE,
        departmentId: operations.id,
        status: RecordStatus.ACTIVE,
      },
    }),
    prisma.user.create({
      data: {
        name: "Ethan Brown",
        email: "ethan.brown@assetflow.local",
        passwordHash,
        role: UserRole.EMPLOYEE,
        departmentId: facilities.id,
        status: RecordStatus.ACTIVE,
      },
    }),
    prisma.user.create({
      data: {
        name: "Isabella Davis",
        email: "isabella.davis@assetflow.local",
        passwordHash,
        role: UserRole.EMPLOYEE,
        departmentId: operations.id,
        status: RecordStatus.ACTIVE,
      },
    }),
  ]);

  const [admin, technologyHead, operationsHead, assetManager, , mia, liam, sofia, ethan] = users;

  await Promise.all([
    prisma.department.update({
      where: { id: technology.id },
      data: { headId: technologyHead.id },
    }),
    prisma.department.update({
      where: { id: operations.id },
      data: { headId: operationsHead.id },
    }),
  ]);

  const categories = await Promise.all(
    ["Electronics", "Furniture", "Vehicles", "IT Equipment", "Facilities"].map((name) =>
      prisma.assetCategory.create({
        data: { name, status: RecordStatus.ACTIVE },
      }),
    ),
  );
  const categoryId = Object.fromEntries(
    categories.map((category: AssetCategory) => [category.name, category.id]),
  );

  const assetRows = [
    {
      tag: "AF-0001",
      name: "MacBook Pro 14",
      categoryId: categoryId["IT Equipment"],
      serialNumber: "MBP14-2026-001",
      acquisitionDate: new Date("2025-01-15"),
      acquisitionCost: "2199.00",
      condition: "Good",
      location: "Technology - Floor 3",
      isBookable: false,
      status: AssetStatus.ALLOCATED,
      currentHolderId: mia.id,
      currentHolderDepartmentId: technology.id,
    },
    {
      tag: "AF-0002",
      name: "Dell Latitude 7450",
      categoryId: categoryId["IT Equipment"],
      serialNumber: "DL7450-2026-002",
      acquisitionDate: new Date("2025-02-10"),
      acquisitionCost: "1649.00",
      condition: "Good",
      location: "IT Store",
      isBookable: false,
      status: AssetStatus.AVAILABLE,
    },
    {
      tag: "AF-0003",
      name: "iPhone 15",
      categoryId: categoryId.Electronics,
      serialNumber: "IPH15-2026-003",
      acquisitionDate: new Date("2025-03-05"),
      acquisitionCost: "899.00",
      condition: "Good",
      location: "Technology - Floor 3",
      isBookable: false,
      status: AssetStatus.ALLOCATED,
      currentHolderId: liam.id,
      currentHolderDepartmentId: technology.id,
    },
    {
      tag: "AF-0004",
      name: "Projector Cart",
      categoryId: categoryId.Electronics,
      serialNumber: "PROJ-CART-004",
      acquisitionDate: new Date("2024-08-20"),
      acquisitionCost: "1850.00",
      condition: "Fair",
      location: "Meeting Storage",
      isBookable: true,
      status: AssetStatus.UNDER_MAINTENANCE,
    },
    {
      tag: "AF-0005",
      name: "Conference Room B2",
      categoryId: categoryId.Facilities,
      serialNumber: "ROOM-B2",
      acquisitionDate: new Date("2020-01-01"),
      acquisitionCost: "12500.00",
      condition: "Good",
      location: "Building B - Floor 2",
      isBookable: true,
      status: AssetStatus.RESERVED,
    },
    {
      tag: "AF-0006",
      name: "Standing Desk",
      categoryId: categoryId.Furniture,
      serialNumber: "DESK-ST-006",
      acquisitionDate: new Date("2024-11-11"),
      acquisitionCost: "720.00",
      condition: "Good",
      location: "Operations - Floor 2",
      isBookable: false,
      status: AssetStatus.AVAILABLE,
    },
    {
      tag: "AF-0007",
      name: "Ergonomic Chair",
      categoryId: categoryId.Furniture,
      serialNumber: "CHAIR-ERG-007",
      acquisitionDate: new Date("2024-11-11"),
      acquisitionCost: "480.00",
      condition: "Good",
      location: "Operations - Floor 2",
      isBookable: false,
      status: AssetStatus.ALLOCATED,
      currentHolderDepartmentId: operations.id,
    },
    {
      tag: "AF-0008",
      name: "Archive Cabinet",
      categoryId: categoryId.Furniture,
      serialNumber: "CAB-ARC-008",
      acquisitionDate: new Date("2022-06-18"),
      acquisitionCost: "390.00",
      condition: "Fair",
      location: "Records Room",
      isBookable: false,
      status: AssetStatus.AVAILABLE,
    },
    {
      tag: "AF-0009",
      name: "Company Van 1",
      categoryId: categoryId.Vehicles,
      serialNumber: "VAN-FLEET-001",
      acquisitionDate: new Date("2023-04-01"),
      acquisitionCost: "34800.00",
      condition: "Good",
      location: "West Parking Lot",
      isBookable: true,
      status: AssetStatus.AVAILABLE,
    },
    {
      tag: "AF-0010",
      name: "Facilities Utility Truck",
      categoryId: categoryId.Vehicles,
      serialNumber: "TRUCK-FAC-010",
      acquisitionDate: new Date("2021-09-15"),
      acquisitionCost: "41500.00",
      condition: "Poor",
      location: "Service Garage",
      isBookable: false,
      status: AssetStatus.UNDER_MAINTENANCE,
    },
    {
      tag: "AF-0011",
      name: "Dell PowerEdge Server",
      categoryId: categoryId["IT Equipment"],
      serialNumber: "PE-R760-011",
      acquisitionDate: new Date("2024-05-22"),
      acquisitionCost: "9800.00",
      condition: "Good",
      location: "Data Center A",
      isBookable: false,
      status: AssetStatus.ALLOCATED,
      currentHolderDepartmentId: technology.id,
    },
    {
      tag: "AF-0012",
      name: "Cisco Network Router",
      categoryId: categoryId["IT Equipment"],
      serialNumber: "CISCO-RTR-012",
      acquisitionDate: new Date("2024-02-12"),
      acquisitionCost: "3200.00",
      condition: "Good",
      location: "IT Store",
      isBookable: false,
      status: AssetStatus.AVAILABLE,
    },
    {
      tag: "AF-0013",
      name: "Multifunction Printer",
      categoryId: categoryId.Electronics,
      serialNumber: "MFP-X950-013",
      acquisitionDate: new Date("2023-07-07"),
      acquisitionCost: "2750.00",
      condition: "Fair",
      location: "Operations - Floor 2",
      isBookable: false,
      status: AssetStatus.AVAILABLE,
    },
    {
      tag: "AF-0014",
      name: "HVAC Control Unit",
      categoryId: categoryId.Facilities,
      serialNumber: "HVAC-CTRL-014",
      acquisitionDate: new Date("2021-01-20"),
      acquisitionCost: "6400.00",
      condition: "Poor",
      location: "Building A - Roof",
      isBookable: false,
      status: AssetStatus.UNDER_MAINTENANCE,
    },
    {
      tag: "AF-0015",
      name: "Access Control Terminal",
      categoryId: categoryId.Facilities,
      serialNumber: "ACCESS-TERM-015",
      acquisitionDate: new Date("2024-10-30"),
      acquisitionCost: "1125.00",
      condition: "Good",
      location: "Building A - Lobby",
      isBookable: false,
      status: AssetStatus.AVAILABLE,
    },
  ];

  await prisma.asset.createMany({ data: assetRows });
  const assets = await prisma.asset.findMany();
  const assetByTag = Object.fromEntries(assets.map((asset: Asset) => [asset.tag, asset]));

  await prisma.allocation.createMany({
    data: [
      {
        assetId: assetByTag["AF-0001"].id,
        employeeId: mia.id,
        departmentId: technology.id,
        allocatedAt: new Date("2026-01-10T09:00:00Z"),
        expectedReturnDate: new Date("2027-01-10T09:00:00Z"),
        status: AllocationStatus.ACTIVE,
      },
      {
        assetId: assetByTag["AF-0003"].id,
        employeeId: liam.id,
        departmentId: technology.id,
        allocatedAt: new Date("2026-02-03T09:00:00Z"),
        status: AllocationStatus.ACTIVE,
      },
      {
        assetId: assetByTag["AF-0007"].id,
        departmentId: operations.id,
        allocatedAt: new Date("2026-03-12T09:00:00Z"),
        status: AllocationStatus.ACTIVE,
      },
    ],
  });

  const now = new Date();
  await prisma.booking.create({
    data: {
      assetId: assetByTag["AF-0005"].id,
      bookedById: sofia.id,
      startTime: new Date(now.getTime() - 30 * 60 * 1000),
      endTime: new Date(now.getTime() + 90 * 60 * 1000),
      status: BookingStatus.ONGOING,
    },
  });

  await prisma.maintenanceRequest.create({
    data: {
      assetId: assetByTag["AF-0004"].id,
      raisedById: ethan.id,
      issueDescription: "Projector powers off intermittently after warming up.",
      priority: MaintenancePriority.HIGH,
      status: MaintenanceStatus.PENDING,
    },
  });

  const auditCycle = await prisma.auditCycle.create({
    data: {
      title: "Q3 2026 Operations Asset Audit",
      scopeDepartmentId: operations.id,
      scopeLocation: "Operations - Floor 2",
      startDate: new Date("2026-07-01"),
      endDate: new Date("2026-07-31"),
      status: AuditCycleStatus.OPEN,
    },
  });

  await prisma.auditAuditor.createMany({
    data: [
      { auditCycleId: auditCycle.id, userId: assetManager.id },
      { auditCycleId: auditCycle.id, userId: admin.id },
    ],
  });

  await prisma.auditItem.createMany({
    data: [
      {
        auditCycleId: auditCycle.id,
        assetId: assetByTag["AF-0002"].id,
        expectedLocation: "IT Store",
        verification: AuditVerification.VERIFIED,
        verifiedById: assetManager.id,
        verifiedAt: now,
      },
      {
        auditCycleId: auditCycle.id,
        assetId: assetByTag["AF-0013"].id,
        expectedLocation: "Operations - Floor 2",
        verification: AuditVerification.MISSING,
        verifiedById: assetManager.id,
        verifiedAt: now,
      },
      {
        auditCycleId: auditCycle.id,
        assetId: assetByTag["AF-0014"].id,
        expectedLocation: "Building A - Roof",
        verification: AuditVerification.DAMAGED,
        verifiedById: assetManager.id,
        verifiedAt: now,
      },
    ],
  });

  console.log("AssetFlow seed completed: 10 users, 3 departments, 5 categories, and 15 assets.");
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
