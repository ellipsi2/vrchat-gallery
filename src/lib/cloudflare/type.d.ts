export interface CloudflareRequestResult<T = any, E = any, M = any> {
    errors: E[];
    messages: M[];
    result: T;
    success: boolean;
}