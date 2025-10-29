
import React, { useState, useMemo } from 'react';
import { type WorkPlan, type Task, type TaskStatus, type ReminderOption } from '../types';
import { TimelineChart } from './TimelineChart';
import { ResetIcon, PdfIcon, ClipboardIcon, CheckIcon } from './Icons';

// Extend window type for jsPDF and jsPDF-AutoTable
declare global {
    interface Window {
        jspdf: any;
    }
}

interface WorkPlanDisplayProps {
  workPlan: WorkPlan;
  onReset: () => void;
  onUpdateTaskStatus: (taskId: number, newStatus: TaskStatus) => void;
  onUpdateTaskReminder: (taskId: number, newReminder: ReminderOption, customDate?: string) => void;
}

const statusColors: Record<TaskStatus, string> = {
  'Not Started': 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200',
  'In Progress': 'bg-blue-200 text-blue-800 dark:bg-blue-700 dark:text-blue-100',
  'Completed': 'bg-green-200 text-green-800 dark:bg-green-700 dark:text-green-100',
  'On Hold': 'bg-yellow-200 text-yellow-800 dark:bg-yellow-600 dark:text-yellow-100',
};

export const WorkPlanDisplay: React.FC<WorkPlanDisplayProps> = ({ workPlan, onReset, onUpdateTaskStatus, onUpdateTaskReminder }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [sortKey, setSortKey] = useState<'default' | 'endDate' | 'status' | 'assignee'>('default');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'All'>('All');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('All');

  const assignees = useMemo(() => {
    return ['All', ...Array.from(new Set(workPlan.tasks.map(task => task.assignee)))];
  }, [workPlan.tasks]);

  const displayedTasks = useMemo(() => {
    let tasks = [...workPlan.tasks];

    // 1. Filtering
    if (statusFilter !== 'All') {
      tasks = tasks.filter(task => task.status === statusFilter);
    }
    if (assigneeFilter !== 'All') {
      tasks = tasks.filter(task => task.assignee === assigneeFilter);
    }

    // 2. Sorting
    switch (sortKey) {
      case 'endDate':
        tasks.sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());
        break;
      case 'status':
        const statusOrder: Record<TaskStatus, number> = {
          'In Progress': 1,
          'On Hold': 2,
          'Not Started': 3,
          'Completed': 4,
        };
        tasks.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);
        break;
      case 'assignee':
        tasks.sort((a, b) => a.assignee.localeCompare(b.assignee));
        break;
      case 'default':
      default:
        tasks.sort((a, b) => a.id - b.id); // Default sort by ID
        break;
    }

    return tasks;
  }, [workPlan.tasks, sortKey, statusFilter, assigneeFilter]);


  const handleExportPdf = () => {
      if (typeof window === 'undefined' || !window.jspdf) {
          alert("PDF generation library is not loaded. Please try refreshing the page.");
          return;
      }
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();

      doc.setFontSize(18);
      doc.text(workPlan.projectName, 14, 22);

      doc.setFontSize(11);
      doc.setTextColor(100);
      const summaryLines = doc.splitTextToSize(workPlan.summary, 180);
      doc.text(summaryLines, 14, 32);

      const tableData = displayedTasks.map(task => ([ // Use displayedTasks for export
          task.id,
          task.name,
          task.description,
          task.assignee,
          `${task.startDate} to ${task.endDate}`,
          task.status
      ]));
      
      const startY = 32 + summaryLines.length * 5 + 5;

      (doc as any).autoTable({
          startY: startY,
          head: [['ID', 'Task', 'Description', 'Assignee', 'Duration', 'Status']],
          body: tableData,
          theme: 'grid',
          styles: {
              fontSize: 8,
              cellPadding: 2,
              overflow: 'linebreak',
          },
          headStyles: {
              fillColor: [79, 70, 229], // indigo-600
              textColor: 255,
              fontStyle: 'bold',
          },
          columnStyles: {
              0: { cellWidth: 8 },
              2: { cellWidth: 60 },
          }
      });

      doc.save(`${workPlan.projectName.replace(/\s+/g, '_')}_Work_Plan.pdf`);
  };

  const handleCopyTasks = () => {
    let text = `Project: ${workPlan.projectName}\n`;
    text += `Summary: ${workPlan.summary}\n\n`;
    text += "--- TASKS (Current View) ---\n\n";

    displayedTasks.forEach(task => { // Use displayedTasks for copy
        text += `Task: ${task.name} (ID: ${task.id})\n`;
        text += `Description: ${task.description}\n`;
        text += `Assignee: ${task.assignee}\n`;
        text += `Duration: ${task.startDate} to ${task.endDate}\n`;
        text += `Status: ${task.status}\n\n`;
    });

    navigator.clipboard.writeText(text.trim()).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2500);
    }).catch(err => {
        console.error('Failed to copy tasks: ', err);
        alert('Failed to copy tasks to clipboard.');
    });
  };

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
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-4">
          <h3 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Task Breakdown</h3>
          <div className="flex items-center gap-2">
            <button
                onClick={handleExportPdf}
                className="inline-flex items-center gap-2 px-3 py-1.5 border border-slate-300 dark:border-slate-600 text-sm font-medium rounded-md text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
                <PdfIcon className="w-4 h-4" />
                Export PDF
            </button>
            <button
                onClick={handleCopyTasks}
                disabled={isCopied}
                className="inline-flex items-center justify-center gap-2 w-[120px] px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-green-600"
            >
                {isCopied ? <CheckIcon className="w-5 h-5" /> : <ClipboardIcon className="w-4 h-4" />}
                {isCopied ? 'Copied!' : 'Copy Tasks'}
            </button>
          </div>
        </div>

        {/* Filter and Sort Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
            <div>
                <label htmlFor="sort-select" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Sort by</label>
                <select
                    id="sort-select"
                    value={sortKey}
                    onChange={(e) => setSortKey(e.target.value as any)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                    <option value="default">Default</option>
                    <option value="endDate">Due Date</option>
                    <option value="status">Status</option>
                    <option value="assignee">Assignee</option>
                </select>
            </div>
            <div>
                <label htmlFor="status-filter" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Filter by Status</label>
                <select
                    id="status-filter"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                    <option value="All">All Statuses</option>
                    {Object.keys(statusColors).map(status => (
                        <option key={status} value={status}>{status}</option>
                    ))}
                </select>
            </div>
            <div>
                <label htmlFor="assignee-filter" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Filter by Assignee</label>
                <select
                    id="assignee-filter"
                    value={assigneeFilter}
                    onChange={(e) => setAssigneeFilter(e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                    {assignees.map(assignee => (
                        <option key={assignee} value={assignee}>{assignee}</option>
                    ))}
                </select>
            </div>
        </div>
        
        <div className="overflow-x-auto shadow-md rounded-lg">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-100 dark:bg-slate-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Task</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Assignee</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Duration</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Reminder</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
              {displayedTasks.map((task) => (
                <tr key={task.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td className="px-6 py-4 whitespace-normal">
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">{task.name}</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">{task.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">{task.assignee}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">{task.startDate} to {task.endDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                        value={task.status}
                        onChange={(e) => onUpdateTaskStatus(task.id, e.target.value as TaskStatus)}
                        className={`px-2.5 py-1 text-xs font-medium rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 focus:ring-indigo-500 cursor-pointer ${statusColors[task.status]}`}
                        aria-label={`Update status for task ${task.name}`}
                    >
                        <option value="Not Started">Not Started</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="On Hold">On Hold</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                        <select
                            value={task.reminder || 'None'}
                            onChange={(e) => {
                                const newReminder = e.target.value as ReminderOption;
                                let customDate: string | undefined;
                                if (newReminder === 'Custom') {
                                    // Default to end date if no custom date is set yet, otherwise keep existing
                                    customDate = task.customReminderDate || task.endDate;
                                }
                                onUpdateTaskReminder(task.id, newReminder, customDate);
                            }}
                            className="bg-transparent border-slate-300 dark:border-slate-600 rounded-md p-1 text-sm text-slate-600 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500"
                            aria-label={`Update reminder for task ${task.name}`}
                        >
                            <option value="None">None</option>
                            <option value="On Due Date">On Due Date</option>
                            <option value="1 Day Before">1 Day Before</option>
                            <option value="3 Days Before">3 Days Before</option>
                            <option value="Custom">Custom</option>
                        </select>
                        {task.reminder === 'Custom' && (
                            <input
                                type="date"
                                value={task.customReminderDate || ''}
                                onChange={(e) => onUpdateTaskReminder(task.id, 'Custom', e.target.value)}
                                max={task.endDate}
                                className="bg-transparent border-slate-300 dark:border-slate-600 rounded-md p-0.5 text-sm text-slate-600 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500"
                                aria-label={`Set custom reminder date for ${task.name}`}
                            />
                        )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {displayedTasks.length === 0 && (
            <div className="text-center py-8 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                No tasks match the current filters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
