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
}
