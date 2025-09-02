export type ActionResult<T = void> = {
  success: boolean;
  message?: string;
  data?: T;
};