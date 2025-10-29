import { type Task, type ReminderOption } from '../types';

const REMINDERS_KEY = 'workPlanTaskReminders';

interface StoredReminder {
  taskId: number;
  taskName: string;
  reminderDate: string; // YYYY-MM-DD
  notified: boolean;
}

// Utility to calculate reminder date
const calculateReminderDate = (task: Task): string | null => {
  if (task.reminder === 'None') return null;
  
  if (task.reminder === 'Custom') {
    return task.customReminderDate || null;
  }

  const dueDate = new Date(task.endDate);
  dueDate.setUTCHours(0, 0, 0, 0); // Normalize to start of day in UTC to avoid timezone issues

  switch (task.reminder) {
    case 'On Due Date':
      // No change needed
      break;
    case '1 Day Before':
      dueDate.setUTCDate(dueDate.getUTCDate() - 1);
      break;
    case '3 Days Before':
      dueDate.setUTCDate(dueDate.getUTCDate() - 3);
      break;
    default:
      return null;
  }
  return dueDate.toISOString().split('T')[0];
};

// Get all reminders from localStorage
const getStoredReminders = (): StoredReminder[] => {
  try {
    const stored = localStorage.getItem(REMINDERS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Failed to parse reminders from localStorage:", error);
    return [];
  }
};

// Save all reminders to localStorage
const saveStoredReminders = (reminders: StoredReminder[]) => {
  try {
    localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
  } catch (error) {
    console.error("Failed to save reminders to localStorage:", error);
  }
};

/**
 * Sets, updates, or clears a reminder for a specific task in localStorage.
 * @param task The task object containing the new reminder preference.
 */
export const updateReminder = (task: Task) => {
  const reminders = getStoredReminders();
  const reminderDate = calculateReminderDate(task);
  const existingIndex = reminders.findIndex(r => r.taskId === task.id);

  if (reminderDate) {
    // Add or update the reminder
    const newReminder: StoredReminder = {
      taskId: task.id,
      taskName: task.name,
      reminderDate,
      notified: false, // Reset 'notified' status whenever a reminder is changed
    };
    if (existingIndex > -1) {
      reminders[existingIndex] = newReminder;
    } else {
      reminders.push(newReminder);
    }
  } else if (existingIndex > -1) {
    // Remove the reminder if the option is set to 'None'
    reminders.splice(existingIndex, 1);
  }

  saveStoredReminders(reminders);
};

/**
 * Checks all stored reminders against the current date and triggers alerts for those that are due.
 */
export const checkAndNotifyReminders = () => {
  if (typeof window === 'undefined') return;

  const reminders = getStoredReminders();
  const today = new Date();
  today.setUTCHours(0,0,0,0); // Normalize to start of day UTC

  let changesMade = false;

  reminders.forEach(reminder => {
    const reminderDate = new Date(reminder.reminderDate);
    reminderDate.setUTCHours(0,0,0,0); // Also normalize for comparison

    if (!reminder.notified && today >= reminderDate) {
      alert(`Reminder: Task "${reminder.taskName}" is due soon!`);
      reminder.notified = true;
      changesMade = true;
    }
  });

  if (changesMade) {
    saveStoredReminders(reminders);
  }
};