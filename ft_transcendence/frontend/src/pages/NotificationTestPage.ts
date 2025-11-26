// Notification System Test Page - Interactive test interface for notifications
// This page is for testing purposes only
import { NotificationTester } from '../components/notifications/NotificationTester';
import { notificationManager } from '../services/notifications/NotificationManager';
import { LoginService } from '../services/auth/LoginService';

export default class NotificationTestPage {
  private container: HTMLElement | null = null;
  private tester: NotificationTester | null = null;
  private statusElement: HTMLElement | null = null;

  render(): string {
    // Check if user is authenticated
    if (!LoginService.isAuthenticated()) {
      return `
        <div style="padding: 2rem; text-align: center; color: #000;">
          <h1 style="color: #000 !important;">Notification System Test Page</h1>
          <p style="color: #000 !important;">Please <a href="/login" data-link style="color: #000 !important;">login</a> first to test notifications.</p>
        </div>
      `;
    }

    return `
      <style>
        #notif-test-page-container h1,
        #notif-test-page-container h2,
        #notif-test-page-container h3,
        #notif-test-page-container p,
        #notif-test-page-container li,
        #notif-test-page-container label,
        #notif-test-page-container pre {
          color: #000 !important;
        }
        #notif-test-page-container .info-box {
          background: #e3f2fd;
          border-left: 4px solid #2196F3;
          padding: 1rem;
          margin: 1rem 0;
        }
        #notif-test-page-container .success-box {
          background: #e8f5e9;
          border-left: 4px solid #4CAF50;
          padding: 1rem;
          margin: 1rem 0;
        }
        #notif-test-page-container .warning-box {
          background: #fff3e0;
          border-left: 4px solid #FF9800;
          padding: 1rem;
          margin: 1rem 0;
        }
      </style>
      <div id="notif-test-page-container" style="max-width: 1400px; margin: 0 auto; padding: 2rem; color: #000;">
        <h1 style="margin-bottom: 1rem; color: #000 !important;">🔔 Notification System Test Page</h1>
        <p style="color: #000 !important; margin-bottom: 2rem;">
          Test the notification system with interactive controls. Click the buttons below to trigger different types of notifications.
        </p>

        <div class="info-box">
          <h3 style="margin-top: 0; color: #000 !important;">📋 What to Test</h3>
          <ul style="color: #000 !important; margin: 0.5rem 0;">
            <li>Bell icon in header should show badge when notifications are unread</li>
            <li>Chat messages appear in panel only (normal priority)</li>
            <li>Invitations appear in panel + toast popup (high priority)</li>
            <li>Friend requests appear in panel + toast popup (high priority)</li>
            <li>Toast popups auto-dismiss after 3 seconds</li>
            <li>Click notification to mark as read</li>
            <li>Action buttons (Accept/Decline) work correctly</li>
          </ul>
        </div>
        
        <div style="background: #f5f5f5; padding: 1.5rem; border-radius: 8px; margin-bottom: 2rem;">
          <h2 style="margin-top: 0; font-size: 1.2rem; color: #000 !important;">System Status</h2>
          <div id="notif-status" style="font-family: monospace; color: #000 !important;">
            Checking...
          </div>
          <button 
            id="refresh-status-btn"
            style="margin-top: 1rem; padding: 0.5rem 1rem; background: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer;"
          >
            Refresh Status
          </button>
        </div>

        <div style="background: #f5f5f5; padding: 1.5rem; border-radius: 8px; margin-bottom: 2rem;">
          <h2 style="margin-top: 0; font-size: 1.2rem; color: #000 !important;">Quick Actions</h2>
          <div style="display: flex; flex-wrap: wrap; gap: 1rem; margin-bottom: 1rem;">
            <button id="clear-all-btn" style="padding: 0.5rem 1rem; background: #9E9E9E; color: white; border: none; border-radius: 4px; cursor: pointer;">
              Clear All Notifications
            </button>
            <button id="mark-all-read-btn" style="padding: 0.5rem 1rem; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">
              Mark All as Read
            </button>
            <button id="show-all-btn" style="padding: 0.5rem 1rem; background: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer;">
              Show All Notifications (Console)
            </button>
          </div>
        </div>

        <div style="background: #f5f5f5; padding: 1.5rem; border-radius: 8px; margin-bottom: 2rem;">
          <h2 style="margin-top: 0; font-size: 1.2rem; color: #000 !important;">Notification Tester</h2>
          <p style="color: #000 !important; margin-bottom: 1rem;">
            Use the buttons below to trigger test notifications:
          </p>
          <div id="notification-tester-container"></div>
        </div>

        <div style="background: #f5f5f5; padding: 1.5rem; border-radius: 8px; margin-bottom: 2rem;">
          <h2 style="margin-top: 0; font-size: 1.2rem; color: #000 !important;">Current Notifications</h2>
          <div 
            id="notif-list" 
            style="background: white; border: 1px solid #ddd; border-radius: 4px; padding: 1rem; max-height: 400px; overflow-y: auto; min-height: 200px; font-family: monospace; font-size: 0.9rem; color: #000 !important;"
          >
            <div style="color: #000 !important;">Loading...</div>
          </div>
          <button 
            id="refresh-list-btn"
            style="margin-top: 1rem; padding: 0.5rem 1rem; background: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer;"
          >
            Refresh List
          </button>
        </div>

        <div class="success-box">
          <h3 style="margin-top: 0; color: #000 !important;">✅ Expected Behavior</h3>
          <ul style="color: #000 !important; margin: 0.5rem 0;">
            <li><strong>Normal Priority (Panel Only):</strong> Chat messages, game started, achievements</li>
            <li><strong>High Priority (Panel + Toast):</strong> Invitations, friend requests</li>
            <li><strong>Badge Counter:</strong> Shows unread count (1-9, or "9+" for 10+)</li>
            <li><strong>Persistence:</strong> Notifications survive page refresh (localStorage)</li>
          </ul>
        </div>

        <div class="warning-box">
          <h3 style="margin-top: 0; color: #000 !important;">⚠️ Note</h3>
          <p style="color: #000 !important; margin: 0;">
            This test page works independently of the WebSocket backend. 
            Real notifications will appear automatically once the backend WebSocket server is running and sending messages.
          </p>
        </div>
      </div>
    `;
  }

  private setupEventHandlers(): void {
    this.statusElement = document.getElementById('notif-status');

    // Initialize notification tester component
    const testerContainer = document.getElementById('notification-tester-container');
    if (testerContainer) {
      this.tester = new NotificationTester();
      this.tester.mount('#notification-tester-container');
    }

    // Clear all button
    document.getElementById('clear-all-btn')?.addEventListener('click', () => {
      if (confirm('Clear all notifications?')) {
        notificationManager.clearAll();
        this.updateNotificationList();
        this.updateStatus();
      }
    });

    // Mark all as read button
    document.getElementById('mark-all-read-btn')?.addEventListener('click', () => {
      notificationManager.markAllAsRead();
      this.updateNotificationList();
      this.updateStatus();
    });

    // Show all in console button
    document.getElementById('show-all-btn')?.addEventListener('click', () => {
      const notifications = notificationManager.getAll();
      console.log('=== All Notifications ===');
      console.log(`Total: ${notifications.length}`);
      console.log(`Unread: ${notificationManager.getUnreadCount()}`);
      console.table(notifications);
      alert(`Logged ${notifications.length} notifications to console`);
    });

    // Refresh status button
    document.getElementById('refresh-status-btn')?.addEventListener('click', () => {
      this.updateStatus();
    });

    // Refresh list button
    document.getElementById('refresh-list-btn')?.addEventListener('click', () => {
      this.updateNotificationList();
    });

    // Subscribe to notification changes
    notificationManager.subscribe(() => {
      this.updateNotificationList();
      this.updateStatus();
    });

    // Initial updates
    this.updateStatus();
    this.updateNotificationList();
  }

  private updateStatus(): void {
    if (!this.statusElement) return;

    const isReady = notificationManager.isReady();
    const unreadCount = notificationManager.getUnreadCount();
    const total = notificationManager.getAll().length;

    this.statusElement.innerHTML = `
      <div style="color: #000 !important;">
        <div>🔔 NotificationManager: <strong style="color: ${isReady ? '#4CAF50' : '#f44336'} !important;">${isReady ? 'Ready' : 'Not Ready'}</strong></div>
        <div style="margin-top: 0.5rem;">📊 Total Notifications: <strong>${total}</strong></div>
        <div>📬 Unread: <strong>${unreadCount}</strong></div>
        <div>✅ Read: <strong>${total - unreadCount}</strong></div>
      </div>
    `;
  }

  private updateNotificationList(): void {
    const listContainer = document.getElementById('notif-list');
    if (!listContainer) return;

    const notifications = notificationManager.getAll();

    if (notifications.length === 0) {
      listContainer.innerHTML = '<div style="color: #000 !important;">No notifications yet. Use the tester above to create some!</div>';
      return;
    }

    listContainer.innerHTML = notifications.map((notif, index) => {
      const priorityColor = notif.priority === 'high' ? '#FF5722' : '#2196F3';
      const readStatus = notif.read ? '✅ Read' : '🔴 Unread';
      const actionable = notif.actionable ? '⚡ Actionable' : '';
      
      return `
        <div style="padding: 0.75rem; margin-bottom: 0.5rem; border: 1px solid #ddd; border-radius: 4px; background: ${notif.read ? '#f9f9f9' : '#fff'};">
          <div style="display: flex; justify-content: between; gap: 1rem; margin-bottom: 0.5rem;">
            <strong style="color: #000 !important;">#${index + 1}</strong>
            <span style="color: ${priorityColor} !important; font-weight: bold;">${notif.type.toUpperCase()}</span>
            <span style="color: #666 !important;">${readStatus}</span>
            ${actionable ? `<span style="color: #FF9800 !important;">${actionable}</span>` : ''}
          </div>
          <div style="color: #000 !important;">
            <div><strong>Title:</strong> ${this.escapeHtml(notif.title)}</div>
            <div><strong>Message:</strong> ${this.escapeHtml(notif.message)}</div>
            <div style="font-size: 0.85rem; color: #666 !important; margin-top: 0.25rem;">
              <strong>Time:</strong> ${new Date(notif.timestamp).toLocaleString()}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  mount(selector: string): void {
    this.container = document.querySelector(selector);
    if (!this.container) {
      console.error(`Element with selector "${selector}" not found`);
      return;
    }
    this.setupEventHandlers();
  }

  dispose(): void {
    // Cleanup - tester will be cleaned up when page is unmounted
    this.tester = null;
    this.container = null;
    this.statusElement = null;
  }
}
