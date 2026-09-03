// src/services/notificationService.ts

export type NotificationType = 'deadline_warning' | 'invoice_overdue' | 'daily_log_reminder' | 'timer_running';

export interface NotificationPayload {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  targetUrl?: string;
  icon?: string;
}

class NotificationService {
  private isSupported: boolean;

  constructor() {
    this.isSupported = typeof window !== 'undefined' && 'Notification' in window;
  }

  /**
   * Request browser permission for local/web notifications
   */
  public async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported) {
      console.warn('Notifications not supported in this environment.');
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    const permission = await Notification.requestPermission();
    return permission;
  }

  /**
   * Check if notifications are currently permitted
   */
  public isGranted(): boolean {
    return this.isSupported && Notification.permission === 'granted';
  }

  /**
   * Trigger an immediate local notification
   */
  public sendLocalNotification(payload: NotificationPayload): void {
    if (!this.isGranted()) return;

    try {
      const options: NotificationOptions = {
        body: payload.body,
        icon: payload.icon || '/favicon.ico',
        badge: '/favicon.ico',
        tag: payload.id, // Replaces notification with same ID if already active
      };

      const notification = new Notification(payload.title, options);

      notification.onclick = () => {
        window.focus();
        if (payload.targetUrl) {
          window.location.href = payload.targetUrl;
        }
        notification.close();
      };
    } catch (err) {
      console.error('Failed to display browser notification:', err);
    }
  }

  /**
   * Evaluates deadlines and invoices in the workspace to send timely alerts
   */
  public evaluateWorkspaceAlerts(data: {
    overdueInvoicesCount: number;
    overdueInvoicesTotal: number;
    upcomingDeadlines: { projectName: string; daysRemaining: number }[];
    unloggedHoursAlert: boolean;
  }): void {
    if (!this.isGranted()) return;

    // 1. Unpaid / Overdue invoice alert
    if (data.overdueInvoicesCount > 0) {
      this.sendLocalNotification({
        id: `invoice-overdue-${new Date().toDateString()}`,
        type: 'invoice_overdue',
        title: '⚠️ Action Required: Overdue Invoices',
        body: `You have ${data.overdueInvoicesCount} overdue invoice(s) totaling $${data.overdueInvoicesTotal.toLocaleString()}. Click to review or send reminders.`,
      });
    }

    // 2. Upcoming deadline warnings (< 48 hours)
    data.upcomingDeadlines.forEach((dl) => {
      if (dl.daysRemaining <= 2 && dl.daysRemaining >= 0) {
        this.sendLocalNotification({
          id: `deadline-${dl.projectName}-${new Date().toDateString()}`,
          type: 'deadline_warning',
          title: `⏳ Deadline Approaching: ${dl.projectName}`,
          body: `Due in ${dl.daysRemaining === 0 ? 'today!' : `${dl.daysRemaining} day(s)`}. Ensure your milestones and time logs are up to date.`,
        });
      }
    });

    // 3. End of day time logging reminder
    if (data.unloggedHoursAlert) {
      this.sendLocalNotification({
        id: `daily-time-${new Date().toDateString()}`,
        type: 'daily_log_reminder',
        title: '⏱️ Daily Time Logging Check-in',
        body: 'You have fewer than 4 hours logged today. Don’t leave unbilled work behind!',
      });
    }
  }
}

export const notificationService = new NotificationService();
