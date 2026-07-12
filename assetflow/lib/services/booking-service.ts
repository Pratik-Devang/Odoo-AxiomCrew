import { prisma } from "@/lib/prisma";
import { BookingStatus, UserRole } from "@prisma/client";
import { NotificationService } from "./notification-service";

export class BookingService {
  private static isBusinessHours(date: Date): boolean {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const timeVal = hours * 60 + minutes;
    return timeVal >= 8 * 60 && timeVal <= 18 * 60;
  }

  static async getBookingsForAsset(assetId: number, dateString: string) {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return { error: "Invalid date format", code: "VALIDATION_FAILED", status: 400 };
      }

      // Start and end of the day
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const bookings = await prisma.booking.findMany({
        where: {
          assetId,
          startTime: { gte: startOfDay },
          endTime: { lte: endOfDay },
          status: { not: BookingStatus.CANCELLED },
        },
        include: {
          bookedBy: { select: { id: true, name: true, role: true } },
        },
        orderBy: { startTime: "asc" },
      });

      // Compute status dynamically on read
      const computedBookings = bookings.map((b) => {
        let status = b.status;
        if (b.status !== BookingStatus.CANCELLED) {
          const now = new Date();
          if (now < b.startTime) {
            status = BookingStatus.UPCOMING;
          } else if (now >= b.startTime && now <= b.endTime) {
            status = BookingStatus.ONGOING;
          } else {
            status = BookingStatus.COMPLETED;
          }
        }
        return {
          ...b,
          status,
        };
      });

      return { bookings: computedBookings };
    } catch (err) {
      console.error("Failed to retrieve bookings:", err);
      return { error: "Failed to retrieve bookings", code: "INTERNAL_ERROR", status: 500 };
    }
  }

  static async getAllBookings(startDateString: string, endDateString: string) {
    try {
      const start = new Date(startDateString);
      const end = new Date(endDateString);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return { error: "Invalid date format", code: "VALIDATION_FAILED", status: 400 };
      }

      const bookings = await prisma.booking.findMany({
        where: {
          startTime: { gte: start },
          endTime: { lte: end },
          status: { not: BookingStatus.CANCELLED },
        },
        include: {
          asset: { select: { id: true, tag: true, name: true } },
          bookedBy: { select: { id: true, name: true, role: true } },
        },
        orderBy: { startTime: "asc" },
      });

      const computedBookings = bookings.map((b) => {
        let status = b.status;
        const now = new Date();
        if (now < b.startTime) {
          status = BookingStatus.UPCOMING;
        } else if (now >= b.startTime && now <= b.endTime) {
          status = BookingStatus.ONGOING;
        } else {
          status = BookingStatus.COMPLETED;
        }
        return {
          ...b,
          status,
        };
      });

      return { bookings: computedBookings };
    } catch (err) {
      console.error("Failed to retrieve all bookings:", err);
      return { error: "Failed to retrieve bookings", code: "INTERNAL_ERROR", status: 500 };
    }
  }

  static calculateEventLayout(start: Date, end: Date) {
    const startHour = start.getHours();
    const startMin = start.getMinutes();
    const endHour = end.getHours();
    const endMin = end.getMinutes();

    const businessStart = 8 * 60; // 08:00 = 480
    const businessEnd = 18 * 60;  // 18:00 = 1080

    const rawStart = startHour * 60 + startMin;
    const rawEnd = endHour * 60 + endMin;

    // Clamp to business hours
    const clampedStart = Math.max(businessStart, Math.min(businessEnd, rawStart));
    const clampedEnd = Math.max(businessStart, Math.min(businessEnd, rawEnd));

    const durationMinutes = Math.max(0, clampedEnd - clampedStart);
    const topPercent = ((clampedStart - businessStart) / (businessEnd - businessStart)) * 100;
    const heightPercent = (durationMinutes / (businessEnd - businessStart)) * 100;

    return {
      topPercent,
      heightPercent,
      durationMinutes,
    };
  }

  static async getCalendarEvents(startDate: Date, endDate: Date, resourceId?: number) {
    const whereClause: any = {
      status: { not: BookingStatus.CANCELLED },
      startTime: { gte: startDate, lt: endDate },
    };

    if (resourceId) {
      whereClause.assetId = resourceId;
    }

    const bookings = await prisma.booking.findMany({
      where: whereClause,
      include: {
        asset: { select: { id: true, tag: true, name: true } },
        bookedBy: { select: { id: true, name: true, role: true } },
      },
      orderBy: { startTime: "asc" },
    });

    return bookings.map((b) => {
      const start = new Date(b.startTime);
      const end = new Date(b.endTime);
      const layout = this.calculateEventLayout(start, end);

      // Compute status dynamically on read
      let status = b.status;
      const now = new Date();
      if (now < start) {
        status = BookingStatus.UPCOMING;
      } else if (now >= start && now <= end) {
        status = BookingStatus.ONGOING;
      } else {
        status = BookingStatus.COMPLETED;
      }

      return {
        id: `b-${b.id}`,
        type: "BOOKING" as const,
        assetId: b.assetId,
        assetName: b.asset.name,
        assetTag: b.asset.tag,
        title: b.asset.name,
        start: start.toISOString(),
        end: end.toISOString(),
        color: "blue",
        status: status,
        topPercent: layout.topPercent,
        heightPercent: layout.heightPercent,
        durationMinutes: layout.durationMinutes,
        metadata: {
          bookedBy: b.bookedBy.name,
          bookedById: b.bookedBy.id,
          role: b.bookedBy.role,
        },
      };
    });
  }

  static async getMyBookings(userId: number) {
    try {
      const bookings = await prisma.booking.findMany({
        where: {
          bookedById: userId,
          status: { not: BookingStatus.CANCELLED },
        },
        include: {
          asset: { select: { id: true, tag: true, name: true } },
        },
        orderBy: { startTime: "asc" },
      });

      const computedBookings = bookings.map((b) => {
        let status = b.status;
        const now = new Date();
        if (now < b.startTime) {
          status = BookingStatus.UPCOMING;
        } else if (now >= b.startTime && now <= b.endTime) {
          status = BookingStatus.ONGOING;
        } else {
          status = BookingStatus.COMPLETED;
        }
        return {
          ...b,
          status,
        };
      });

      return { bookings: computedBookings };
    } catch (err) {
      console.error("Failed to fetch my bookings:", err);
      return { error: "Failed to fetch my bookings", code: "INTERNAL_ERROR", status: 500 };
    }
  }

  static async createBooking(
    actorId: number,
    data: {
      assetId: number;
      startTime: string;
      endTime: string;
    }
  ) {
    const start = new Date(data.startTime);
    const end = new Date(data.endTime);

    // 1. Time validations
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return { error: "Invalid date format for start/end time.", code: "VALIDATION_FAILED", status: 400 };
    }

    if (start >= end) {
      return { error: "Start time must be strictly before end time.", code: "VALIDATION_FAILED", status: 400 };
    }

    if (start < new Date()) {
      return { error: "Cannot book slots in the past.", code: "VALIDATION_FAILED", status: 400 };
    }

    if (start.toDateString() !== end.toDateString()) {
      return { error: "Bookings must start and end on the same day.", code: "VALIDATION_FAILED", status: 400 };
    }

    if (!this.isBusinessHours(start) || !this.isBusinessHours(end)) {
      return {
        error: "Bookings must occur within business hours (08:00 - 18:00).",
        code: "OUT_OF_BUSINESS_HOURS",
        status: 400,
      };
    }

    const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    if (durationMinutes < 15) {
      return { error: "Minimum booking duration is 15 minutes.", code: "INVALID_DURATION", status: 400 };
    }
    if (durationMinutes > 8 * 60) {
      return { error: "Maximum booking duration is 8 hours.", code: "INVALID_DURATION", status: 400 };
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        // Find asset
        const asset = await tx.asset.findUnique({
          where: { id: data.assetId },
        });

        if (!asset) {
          return { error: "Asset not found.", code: "ASSET_NOT_FOUND", status: 404 };
        }

        if (!asset.isBookable) {
          return { error: "This asset is not marked as bookable.", code: "ASSET_NOT_BOOKABLE", status: 400 };
        }

        // Validate asset state
        if (["RETIRED", "DISPOSED", "LOST", "UNDER_MAINTENANCE"].includes(asset.status)) {
          return {
            error: `Asset is unavailable for bookings due to status: ${asset.status.toLowerCase()}.`,
            code: "ASSET_UNAVAILABLE",
            status: 400,
          };
        }

        // Check for overlaps (standard SQL overlap: A.start < B.end AND A.end > B.start)
        const conflict = await tx.booking.findFirst({
          where: {
            assetId: data.assetId,
            status: { not: BookingStatus.CANCELLED },
            startTime: { lt: end },
            endTime: { gt: start },
          },
          include: {
            bookedBy: { select: { name: true } },
          },
        });

        if (conflict) {
          return {
            error: "Selected time slot is unavailable.",
            code: "BOOKING_CONFLICT",
            status: 409,
            details: {
              conflictingBooking: {
                id: conflict.id,
                startTime: conflict.startTime.toISOString(),
                endTime: conflict.endTime.toISOString(),
                bookedBy: {
                  name: conflict.bookedBy.name,
                },
              },
            },
          };
        }

        // Create booking
        const booking = await tx.booking.create({
          data: {
            assetId: data.assetId,
            bookedById: actorId,
            startTime: start,
            endTime: end,
            status: BookingStatus.UPCOMING,
          },
          include: {
            asset: { select: { tag: true, name: true } },
          },
        });

        return {
          success: true,
          booking,
        };
      });

      if ("success" in result && result.success) {
        // Send notification asynchronously
        NotificationService.notifyBookingConfirmed(
          actorId,
          result.booking.asset.tag,
          result.booking.asset.name,
          result.booking.startTime,
          result.booking.endTime
        );
      }

      return result;
    } catch (err) {
      console.error("Booking creation failed:", err);
      return { error: "Internal server error occurred.", code: "DATABASE_ERROR", status: 500 };
    }
  }

  static async cancelBooking(actorId: number, actorRole: UserRole, bookingId: number) {
    try {
      const result = await prisma.$transaction(async (tx) => {
        const booking = await tx.booking.findUnique({
          where: { id: bookingId },
          include: {
            asset: { select: { tag: true, name: true } },
          },
        });

        if (!booking) {
          return { error: "Booking record not found.", code: "BOOKING_NOT_FOUND", status: 404 };
        }

        if (booking.status === BookingStatus.CANCELLED) {
          return { error: "Booking is already cancelled.", code: "BOOKING_INVALID_STATE", status: 400 };
        }

        const isPrivileged = actorRole === UserRole.ADMIN || actorRole === UserRole.ASSET_MANAGER;
        if (booking.bookedById !== actorId && !isPrivileged) {
          return {
            error: "You do not have permission to cancel this booking.",
            code: "PERMISSION_DENIED",
            status: 403,
          };
        }

        const now = new Date();
        if (booking.endTime < now) {
          return {
            error: "Cannot cancel a booking that has already completed.",
            code: "BOOKING_INVALID_STATE",
            status: 400,
          };
        }

        // Cancel it
        const updatedBooking = await tx.booking.update({
          where: { id: bookingId },
          data: { status: BookingStatus.CANCELLED },
        });

        return {
          success: true,
          booking: {
            ...updatedBooking,
            asset: booking.asset,
          },
        };
      });

      if ("success" in result && result.success) {
        NotificationService.notifyBookingCancelled(
          result.booking.bookedById,
          result.booking.asset.tag,
          result.booking.asset.name,
          result.booking.startTime,
          result.booking.endTime
        );
      }

      return result;
    } catch (err) {
      console.error("Cancel booking failed:", err);
      return { error: "Internal server error occurred.", code: "DATABASE_ERROR", status: 500 };
    }
  }

  static async rescheduleBooking(
    actorId: number,
    actorRole: UserRole,
    bookingId: number,
    data: { startTime: string; endTime: string }
  ) {
    const start = new Date(data.startTime);
    const end = new Date(data.endTime);

    // 1. Time validations
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return { error: "Invalid date format.", code: "VALIDATION_FAILED", status: 400 };
    }
    if (start >= end) {
      return { error: "Start time must be before end time.", code: "VALIDATION_FAILED", status: 400 };
    }
    if (start < new Date()) {
      return { error: "Cannot reschedule to the past.", code: "VALIDATION_FAILED", status: 400 };
    }
    if (start.toDateString() !== end.toDateString()) {
      return { error: "Rescheduled dates must start and end on the same day.", code: "VALIDATION_FAILED", status: 400 };
    }
    if (!this.isBusinessHours(start) || !this.isBusinessHours(end)) {
      return {
        error: "Rescheduled slots must occur within business hours (08:00 - 18:00).",
        code: "OUT_OF_BUSINESS_HOURS",
        status: 400,
      };
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        const booking = await tx.booking.findUnique({
          where: { id: bookingId },
          include: {
            asset: { select: { tag: true, name: true } },
          },
        });

        if (!booking) {
          return { error: "Booking not found.", code: "BOOKING_NOT_FOUND", status: 404 };
        }

        if (booking.status === BookingStatus.CANCELLED) {
          return { error: "Cannot reschedule a cancelled booking.", code: "BOOKING_INVALID_STATE", status: 400 };
        }

        const isPrivileged = actorRole === UserRole.ADMIN || actorRole === UserRole.ASSET_MANAGER;
        if (booking.bookedById !== actorId && !isPrivileged) {
          return {
            error: "You do not have permission to reschedule this booking.",
            code: "PERMISSION_DENIED",
            status: 403,
          };
        }

        // Check for conflicts excluding the booking itself
        const conflict = await tx.booking.findFirst({
          where: {
            assetId: booking.assetId,
            id: { not: bookingId },
            status: { not: BookingStatus.CANCELLED },
            startTime: { lt: end },
            endTime: { gt: start },
          },
          include: {
            bookedBy: { select: { name: true } },
          },
        });

        if (conflict) {
          return {
            error: "Selected time slot is unavailable.",
            code: "BOOKING_CONFLICT",
            status: 409,
            details: {
              conflictingBooking: {
                id: conflict.id,
                startTime: conflict.startTime.toISOString(),
                endTime: conflict.endTime.toISOString(),
                bookedBy: {
                  name: conflict.bookedBy.name,
                },
              },
            },
          };
        }

        // Reschedule
        const updatedBooking = await tx.booking.update({
          where: { id: bookingId },
          data: {
            startTime: start,
            endTime: end,
            status: BookingStatus.UPCOMING,
          },
        });

        return {
          success: true,
          booking: {
            ...updatedBooking,
            asset: booking.asset,
          },
        };
      });

      if ("success" in result && result.success) {
        NotificationService.notifyBookingRescheduled(
          result.booking.bookedById,
          result.booking.asset.tag,
          result.booking.asset.name,
          result.booking.startTime,
          result.booking.endTime
        );
      }

      return result;
    } catch (err) {
      console.error("Reschedule transaction failed:", err);
      return { error: "Internal server error occurred.", code: "DATABASE_ERROR", status: 500 };
    }
  }
}
