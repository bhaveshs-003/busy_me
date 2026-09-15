import { useNavigate } from 'react-router-dom';
import { ListTodo, Plus } from 'lucide-react';
import type { Task } from '@/types/index';
import { TaskCard } from '@/components/tasks/TaskCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { useTaskStore } from '@/store/taskStore';

// =============================================================================
// PackTasks — the tasks linked to a research pack
//
// Open tasks sort above completed ones so the pack reads as "what's left".
// =============================================================================

export interface PackTasksProps {
  tasks: Task[];
  onAddTask: () => void;
}

export function PackTasks({ tasks, onAddTask }: PackTasksProps) {
  const navigate = useNavigate();
  const completeTask = useTaskStore((s) => s.completeTask);
  const uncompleteTask = useTaskStore((s) => s.uncompleteTask);

  function handleToggle(task: Task) {
    if (task.status === 'completed') void uncompleteTask(task.id);
    else void completeTask(task.id);
  }

  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={<ListTodo />}
        title="No tasks yet"
        description="Add a task so the work on this pack has somewhere to live."
        action={{ label: 'Add task', onClick: onAddTask }}
      />
    );
  }

  const ordered = [...tasks].sort((a, b) => {
    const aDone = a.status === 'completed' ? 1 : 0;
    const bDone = b.status === 'completed' ? 1 : 0;
    if (aDone !== bDone) return aDone - bDone;
    // Then soonest due date first; undated tasks sink to the bottom.
    const aDue = a.dueDate ? Date.parse(a.dueDate) : Number.POSITIVE_INFINITY;
    const bDue = b.dueDate ? Date.parse(b.dueDate) : Number.POSITIVE_INFINITY;
    return aDue - bDue;
  });

  return (
    <div className="space-y-3">
      <Button variant="outline" size="sm" onClick={onAddTask} className="w-full">
        <Plus className="h-4 w-4" aria-hidden="true" />
        Add task to this pack
      </Button>

      <ul className="space-y-2">
        {ordered.map((task) => (
          <li key={task.id}>
            <TaskCard
              task={task}
              onToggleComplete={handleToggle}
              onClick={(t) => navigate(`/tasks/${t.id}`)}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default PackTasks;
