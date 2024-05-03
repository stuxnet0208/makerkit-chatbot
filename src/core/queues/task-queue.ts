/**
 * Generic task queue interface
 * @interface TaskQueue
 * @template Params - The type of the parameters that are passed to the task.
 */
abstract class TaskQueue<CreateParams, VerifyParams> {
  abstract create(params: CreateParams): Promise<unknown>;
  abstract verify(params: VerifyParams): Promise<void>;
}

export default TaskQueue;