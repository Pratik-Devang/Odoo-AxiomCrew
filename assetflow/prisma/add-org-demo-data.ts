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
  const departmentByName = Object.fromEntries(departments.map((department: { id: number; name: string }) => [department.name, department]));

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

  const userByEmail = Object.fromEntries(users.map((user: { id: number; email: string }) => [user.email, user]));
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

  console.log("Added/updated 5 departments and 12 users without deleting existing data.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });