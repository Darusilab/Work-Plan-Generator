
export type TaskStatus = 'Not Started' | 'In Progress' | 'Completed' | 'On Hold';

export interface Task {
  id: number;
  name: string;
  description: string;
  assignee: string;
  startDate: string; // Format: YYYY-MM-DD
  endDate: string; // Format: YYYY-MM-DD
  status: TaskStatus;
}

export interface WorkPlan {
  projectName: string;
  summary: string;
  tasks: Task[];
}
