
export type TaskStatus = 'Not Started' | 'In Progress' | 'Completed' | 'On Hold';
export type ReminderOption = 'None' | 'On Due Date' | '1 Day Before' | '3 Days Before' | 'Custom';

export interface Task {
  id: number;
  name: string;
  description: string;
  assignee: string;
  startDate: string; // Format: YYYY-MM-DD
  endDate: string; // Format: YYYY-MM-DD
  status: TaskStatus;
  reminder: ReminderOption;
  customReminderDate?: string; // Format: YYYY-MM-DD. Used when reminder is 'Custom'
}

export interface WorkPlan {
  projectName: string;
  summary: string;
  tasks: Task[];
}