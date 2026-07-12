import { prisma } from "@/lib/prisma";
import { NotificationType } from "@prisma/client";

export class NotificationService {
  static async notifyAssigned(userId: number, assetTag: string, assetName: string) {
    try {
      await prisma.notification.create({
        data: {
          userId,
          type: NotificationType.ASSET_ASSIGNED,
          message: `Asset ${assetTag} (${assetName}) has been allocated to you.`,
          isRead: false,
        },
      });
    } catch (err) {
      console.error("Failed to create allocation notification:", err);
    }
  }

  static async notifyTransferApproved(
    fromUserId: number,
    toUserId: number,
    assetTag: string,
    assetName: string
  ) {
    try {
      // Create notification for old holder
      await prisma.notification.create({
        data: {
          userId: fromUserId,
          type: NotificationType.TRANSFER_APPROVED,
          message: `Your transfer request for asset ${assetTag} (${assetName}) has been approved and transferred.`,
          isRead: false,
        },
      });

      // Create notification for new holder
      await prisma.notification.create({
        data: {
          userId: toUserId,
          type: NotificationType.TRANSFER_APPROVED,
          message: `Asset ${assetTag} (${assetName}) has been transferred to you.`,
          isRead: false,
        },
      });
    } catch (err) {
      console.error("Failed to create transfer notifications:", err);
    }
  }

  static async notifyBookingConfirmed(
    userId: number,
    assetTag: string,
    assetName: string,
    startTime: Date,
    endTime: Date
  ) {
    try {
      const startStr = startTime.toLocaleString();
      const endStr = endTime.toLocaleString();
      await prisma.notification.create({
        data: {
          userId,
          type: NotificationType.BOOKING_CONFIRMED,
          message: `Booking confirmed for ${assetTag} (${assetName}) from ${startStr} to ${endStr}.`,
          isRead: false,
        },
      });
    } catch (err) {
      console.error("Failed to create booking confirmation notification:", err);
    }
  }

  static async notifyBookingCancelled(
    userId: number,
    assetTag: string,
    assetName: string,
    startTime: Date,
    endTime: Date
  ) {
    try {
      const startStr = startTime.toLocaleString();
      await prisma.notification.create({
        data: {
          userId,
          type: NotificationType.BOOKING_CANCELLED,
          message: `Booking for ${assetTag} (${assetName}) scheduled on ${startStr} has been cancelled.`,
          isRead: false,
        },
      });
    } catch (err) {
      console.error("Failed to create booking cancellation notification:", err);
    }
  }

  static async notifyBookingRescheduled(
    userId: number,
    assetTag: string,
    assetName: string,
    startTime: Date,
    endTime: Date
  ) {
    try {
      const startStr = startTime.toLocaleString();
      const endStr = endTime.toLocaleString();
      await prisma.notification.create({
        data: {
          userId,
          type: NotificationType.BOOKING_CONFIRMED, // Reuse confirmed type
          message: `Your booking for ${assetTag} (${assetName}) has been rescheduled to: ${startStr} to ${endStr}.`,
          isRead: false,
        },
      });
    } catch (err) {
      console.error("Failed to create booking reschedule notification:", err);
    }
  }
}
