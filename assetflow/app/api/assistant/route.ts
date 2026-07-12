import { NextResponse } from "next/server";
import { addDays, format, setHours, setMinutes, startOfDay } from "date-fns";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

type AssistantResult = {
  title: string;
  answer: string;
  lines?: string[];
  action?: "answer" | "created_booking" | "created_allocation";
};

function clean(input: string) {
  return input.toLowerCase().replace(/[?!.]/g, " ").replace(/\s+/g, " ").trim();
}

function titleCaseStatus(status: string) {
  return status.split("_").map((word) => word[0] + word.slice(1).toLowerCase()).join(" ");
}

function clarification(title = "I need a little more detail"): AssistantResult {
  return {
    title,
    answer: "I can help, but I don't want to guess and change the wrong record. Try one of these formats:",
    lines: [
      "Who has Security Patrol Tablet?",
      "Show overdue assets",
      "Generate maintenance summary",
      "Book HR Interview Room tomorrow at 2 PM",
      "Allocate Dell Latitude to Chloe Park",
    ],
  };
}

function isGreeting(text: string) {
  return /^(hi|hello|hey|yo|sup|good morning|good afternoon|good evening)$/.test(text);
}

function isTooVague(text: string) {
  const words = text.split(" ").filter(Boolean);
  return words.length < 3 && !/^af-\d+/i.test(text);
}

async function findAssetByPhrase(phrase: string) {
  const normalized = clean(phrase)
    .replace(/\b(the|asset|resource|room|meeting|book|show|find|who|has|where|is|a|an)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const terms = normalized.split(" ").filter((term) => term.length > 1);
  const query = terms.length ? terms.join(" ") : phrase;

  if (!/^af-\d+/i.test(query) && terms.length < 2) return null;

  return prisma.asset.findFirst({
    where: {
      OR: [
        { tag: { contains: query, mode: "insensitive" as const } },
        { name: { contains: query, mode: "insensitive" as const } },
        { serialNumber: { contains: query, mode: "insensitive" as const } },
        ...terms.map((term) => ({ name: { contains: term, mode: "insensitive" as const } })),
      ],
    },
    include: {
      category: { select: { name: true } },
      currentHolder: { select: { name: true, email: true, department: { select: { name: true } } } },
      currentHolderDepartment: { select: { name: true } },
    },
    orderBy: { tag: "asc" },
  });
}

async function answerHolder(prompt: string): Promise<AssistantResult> {
  const assetPhrase = clean(prompt).replace("who has", "").replace("where is", "").replace("who holds", "").trim();
  if (isTooVague(assetPhrase)) return clarification("Which asset should I look up?");

  const asset = await findAssetByPhrase(assetPhrase);
  if (!asset) return { title: "Asset not found", answer: "I couldn't find an asset matching that description. Try the tag, serial number, or exact asset name." };

  const holder = asset.currentHolder?.name ?? asset.currentHolderDepartment?.name ?? null;
  const department = asset.currentHolder?.department?.name ?? asset.currentHolderDepartment?.name ?? "Unassigned";

  if (!holder) {
    return {
      title: `${asset.tag} · ${asset.name}`,
      answer: `${asset.name} (${asset.tag}) is not assigned to an employee or department.`,
      lines: [`Category: ${asset.category.name}`, `Status: ${titleCaseStatus(asset.status)}`, `Location: ${asset.location}`],
    };
  }

  return {
    title: `${asset.tag} · ${asset.name}`,
    answer: `${holder} currently has ${asset.name} (${asset.tag}).`,
    lines: [`Department: ${department}`, `Status: ${titleCaseStatus(asset.status)}`, `Location: ${asset.location}`],
  };
}

async function answerOverdue(): Promise<AssistantResult> {
  const overdue = await prisma.allocation.findMany({
    where: { status: "ACTIVE", expectedReturnDate: { lt: new Date() } },
    take: 10,
    orderBy: { expectedReturnDate: "asc" },
    include: { asset: { select: { tag: true, name: true } }, employee: { select: { name: true } }, department: { select: { name: true } } },
  });

  if (!overdue.length) return { title: "Overdue assets", answer: "No active allocations are overdue right now." };

  return {
    title: "Overdue assets",
    answer: `${overdue.length} active allocation${overdue.length === 1 ? " is" : "s are"} overdue for return.`,
    lines: overdue.map((item) => `${item.asset.tag} ${item.asset.name} — ${item.employee?.name ?? item.department?.name ?? "Unassigned"} — due ${item.expectedReturnDate ? format(item.expectedReturnDate, "MMM d, yyyy") : "unknown"}`),
  };
}

async function answerMaintenance(prompt: string): Promise<AssistantResult> {
  const lower = clean(prompt);
  const requests = await prisma.maintenanceRequest.findMany({
    where: { status: { in: ["PENDING", "APPROVED", "TECHNICIAN_ASSIGNED", "IN_PROGRESS"] } },
    take: 12,
    orderBy: { raisedAt: "desc" },
    include: { asset: { select: { tag: true, name: true, location: true } }, raisedBy: { select: { name: true } } },
  });

  if (lower.includes("summary")) {
    const grouped = requests.reduce<Record<string, number>>((acc, request) => {
      acc[request.status] = (acc[request.status] ?? 0) + 1;
      return acc;
    }, {});
    return {
      title: "Maintenance summary",
      answer: `${requests.length} maintenance request${requests.length === 1 ? " is" : "s are"} currently open or in progress.`,
      lines: Object.entries(grouped).map(([status, count]) => `${titleCaseStatus(status)}: ${count}`),
    };
  }

  return {
    title: lower.includes("next week") || lower.includes("due") ? "Assets due for maintenance next week" : "Open maintenance requests",
    answer: requests.length ? `Here are ${requests.length} open maintenance items.` : "No open maintenance requests found.",
    lines: requests.map((request) => `${request.asset.tag} ${request.asset.name} — ${titleCaseStatus(request.status)} — ${titleCaseStatus(request.priority)} priority — raised by ${request.raisedBy.name}`),
  };
}

async function answerIdle(prompt: string): Promise<AssistantResult> {
  const lower = clean(prompt);
  const rawTerm = lower.replace("find", "").replace("all", "").replace("idle", "").replace("unused", "").replace(/in\s+[a-z &]+$/, "").trim();
  const term = rawTerm.replace(/s$/, "");
  const since = addDays(new Date(), -30);
  const assets = await prisma.asset.findMany({
    where: {
      status: "AVAILABLE",
      name: term ? { contains: term, mode: "insensitive" as const } : undefined,
      allocations: { none: { allocatedAt: { gte: since } } },
      bookings: { none: { createdAt: { gte: since } } },
    },
    take: 10,
    include: { category: { select: { name: true } } },
    orderBy: { tag: "asc" },
  });

  return {
    title: "Idle assets",
    answer: assets.length ? `I found ${assets.length} available asset${assets.length === 1 ? "" : "s"} with no allocation or booking activity in the last 30 days.` : "I couldn't find matching idle assets with the current filters.",
    lines: assets.map((asset) => `${asset.tag} ${asset.name} — ${asset.category.name} — ${asset.location}`),
  };
}

function parseDemoBookingTime(prompt: string) {
  const lower = clean(prompt);
  const base = lower.includes("tomorrow") ? addDays(startOfDay(new Date()), 1) : startOfDay(new Date());
  const match = lower.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
  let hour = match ? Number(match[1]) : 14;
  const minute = match?.[2] ? Number(match[2]) : 0;
  const meridiem = match?.[3];
  if (meridiem === "pm" && hour < 12) hour += 12;
  if (meridiem === "am" && hour === 12) hour = 0;
  const startTime = setMinutes(setHours(base, hour), minute);
  return { startTime, endTime: new Date(startTime.getTime() + 60 * 60 * 1000) };
}

async function createBooking(prompt: string, userId: number): Promise<AssistantResult> {
  const lower = clean(prompt);
  const hasTime = /\b(today|tomorrow)\b/.test(lower) || /\b\d{1,2}(:\d{2})?\s*(am|pm)\b/.test(lower);
  if (!hasTime) return clarification("When should I book it?");

  const resourcePhrase = lower.replace("book", "").replace("meeting", "").replace("tomorrow", "").replace(/at\s+\d{1,2}(:\d{2})?\s*(am|pm)?/, "").trim();
  if (isTooVague(resourcePhrase)) return clarification("Which resource should I book?");

  const { startTime, endTime } = parseDemoBookingTime(prompt);
  const asset = await prisma.asset.findFirst({
    where: { isBookable: true, OR: [{ name: { contains: resourcePhrase, mode: "insensitive" as const } }, { tag: { contains: resourcePhrase, mode: "insensitive" as const } }] },
    orderBy: { tag: "asc" },
  });

  if (!asset) return { title: "Booking not created", answer: "I couldn't find a bookable resource matching that request." };

  const conflict = await prisma.booking.findFirst({ where: { assetId: asset.id, status: { in: ["UPCOMING", "ONGOING"] }, startTime: { lt: endTime }, endTime: { gt: startTime } } });
  if (conflict) return { title: "Booking conflict", answer: `${asset.name} is already booked around ${format(startTime, "MMM d, h:mm a")}. Try a different time.` };

  await prisma.booking.create({ data: { assetId: asset.id, bookedById: userId, startTime, endTime, status: "UPCOMING" } });
  await prisma.asset.update({ where: { id: asset.id }, data: { status: "RESERVED" } });

  return { title: "Booking created", action: "created_booking", answer: `Booked ${asset.name} for ${format(startTime, "MMM d, yyyy h:mm a")} to ${format(endTime, "h:mm a")}.`, lines: [`Asset: ${asset.tag}`, "Status: Upcoming"] };
}

async function createAllocation(prompt: string): Promise<AssistantResult> {
  const match = clean(prompt).match(/allocate\s+(?:a|an|the)?\s*(.*?)\s+to\s+(.+)$/);
  if (!match) return { title: "Allocation not created", answer: "Try: Allocate a laptop to Mia Chen." };
  const assetPhrase = match[1].trim();
  const personPhrase = match[2].trim();
  if (isTooVague(assetPhrase) || isTooVague(personPhrase)) return clarification("What asset and employee should I use?");

  const user = await prisma.user.findFirst({ where: { name: { contains: personPhrase, mode: "insensitive" as const }, status: "ACTIVE" } });
  if (!user) return { title: "Employee not found", answer: `I couldn't find an active employee matching "${personPhrase}".` };

  const asset = await prisma.asset.findFirst({
    where: { status: "AVAILABLE", isBookable: false, OR: [{ name: { contains: assetPhrase, mode: "insensitive" as const } }, { category: { name: { contains: assetPhrase, mode: "insensitive" as const } } }] },
    orderBy: { tag: "asc" },
  });
  if (!asset) return { title: "Asset not available", answer: `I couldn't find an available non-bookable asset matching "${assetPhrase}".` };

  await prisma.asset.update({ where: { id: asset.id }, data: { status: "ALLOCATED", currentHolderId: user.id, currentHolderDepartmentId: user.departmentId } });
  await prisma.allocation.create({ data: { assetId: asset.id, employeeId: user.id, departmentId: user.departmentId, allocatedAt: new Date(), expectedReturnDate: addDays(new Date(), 180), status: "ACTIVE" } });

  return { title: "Allocation created", action: "created_allocation", answer: `Allocated ${asset.name} (${asset.tag}) to ${user.name}.`, lines: [`Expected return: ${format(addDays(new Date(), 180), "MMM d, yyyy")}`] };
}

async function answerPrompt(prompt: string, userId: number): Promise<AssistantResult> {
  const lower = clean(prompt);
  if (!lower) return { title: "Ask me anything", answer: "Try asking who has an asset, show overdue assets, or book a room." };
  if (isGreeting(lower)) {
    return {
      title: "Hi, I'm AssistFlow",
      answer: "Ask me about assets, bookings, maintenance, overdue returns, or allocations.",
      lines: ["Who has HR Badge Scanner?", "Show overdue assets", "Book HR Interview Room tomorrow at 2 PM"],
    };
  }
  if (isTooVague(lower)) return clarification();
  if (lower.startsWith("book ")) return createBooking(prompt, userId);
  if (lower.startsWith("allocate ")) return createAllocation(prompt);
  if (lower.includes("who has") || lower.includes("where is") || lower.includes("who holds")) return answerHolder(prompt);
  if (lower.includes("overdue")) return answerOverdue();
  if (lower.includes("maintenance")) return answerMaintenance(prompt);
  if (lower.includes("idle") || lower.includes("unused")) return answerIdle(prompt);
  return clarification();
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  try {
    const body = (await request.json()) as { prompt?: string };
    const result = await answerPrompt(body.prompt ?? "", user.id);
    return NextResponse.json(result);
  } catch (error) {
    console.error("AssistFlow failed:", error);
    return NextResponse.json({ error: "AssistFlow failed to process the request." }, { status: 500 });
  }
}