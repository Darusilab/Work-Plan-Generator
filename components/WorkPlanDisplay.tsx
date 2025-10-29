
import React from 'react';
import { type WorkPlan, type Task, type TaskStatus } from '../types';
import { TimelineChart } from './TimelineChart';
import { ResetIcon } from './Icons';

interface WorkPlanDisplayProps {
  workPlan: WorkPlan;
  onReset: () => void;
}

const statusColors: Record<TaskStatus, string> = {
  'Not Started': 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200',
  'In Progress': 'bg-blue-200 text-blue-800 dark:bg-blue-700 dark:text-blue-100',
  'Completed': 'bg-green-200 text-green-800 dark:bg-green-700 dark:text-green-100',
  'On Hold': 'bg-yellow-200 text-yellow-800 dark:bg-yellow-600 dark:text-yellow-100',
};

const TaskStatusBadge: React.FC<{ status: TaskStatus }> = ({ status }) => (
  <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${statusColors[status]}`}>
    {status}
  </span>
);

export const WorkPlanDisplay: React.FC<WorkPlanDisplayProps> = ({ workPlan, onReset }) => {
  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">{workPlan.projectName}</h2>
            <p className="mt-2 text-slate-600 dark:text-slate-300 max-w-3xl">{workPlan.summary}</p>
        </div>
        <button
            onClick={onReset}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
            <ResetIcon className="w-5 h-5 mr-2" />
            Analyze Another
        </button>
      </div>

      <div>
        <h3 className="text-2xl font-semibold mb-4 text-slate-800 dark:text-slate-100">Project Timeline</h3>
        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg shadow-inner min-h-[300px]">
          <TimelineChart tasks={workPlan.tasks} />
        </div>
      </div>

      <div>
        <h3 className="text-2xl font-semibold mb-4 text-slate-800 dark:text-slate-100">Task Breakdown</h3>
        <div className="overflow-x-auto shadow-md rounded-lg">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-100 dark:bg-slate-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Task</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Assignee</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Duration</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
              {workPlan.tasks.map((task) => (
                <tr key={task.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td className="px-6 py-4 whitespace-normal">
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">{task.name}</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">{task.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">{task.assignee}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">{task.startDate} to {task.endDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap"><TaskStatusBadge status={task.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
