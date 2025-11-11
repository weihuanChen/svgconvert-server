import { v4 as uuidv4 } from 'uuid';
import type { Task, TaskStatus, ConversionParams } from '../types/index.js';

class TaskManager {
  private tasks: Map<string, Task> = new Map();

  createTask(
    inputFile: string,
    inputFormat: string,
    params: ConversionParams
  ): Task {
    const taskId = uuidv4();
    const task: Task = {
      taskId,
      status: 'PENDING',
      inputFile,
      inputFormat: inputFormat as any,
      outputFormat: params.outputFormat,
      params,
      createdAt: new Date(),
    };

    this.tasks.set(taskId, task);
    return task;
  }

  getTask(taskId: string): Task | undefined {
    return this.tasks.get(taskId);
  }

  updateTaskStatus(
    taskId: string,
    status: TaskStatus,
    outputFile?: string,
    error?: string
  ): void {
    const task = this.tasks.get(taskId);
    if (task) {
      task.status = status;
      if (outputFile) task.outputFile = outputFile;
      if (error) task.error = error;
      if (status === 'COMPLETED' || status === 'ERROR') {
        task.completedAt = new Date();
      }
    }
  }

  deleteTask(taskId: string): boolean {
    return this.tasks.delete(taskId);
  }

  getAllTasks(): Task[] {
    return Array.from(this.tasks.values());
  }

  getOldTasks(minutesOld: number): Task[] {
    const now = Date.now();
    const threshold = minutesOld * 60 * 1000;

    return Array.from(this.tasks.values()).filter((task) => {
      const age = now - task.createdAt.getTime();
      return age > threshold;
    });
  }
}

export const taskManager = new TaskManager();
