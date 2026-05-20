export const USER_FACING_LOAD_ERROR =
  "데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.";

export function logLoadError(context: string, error: unknown): void {
  console.error(`[${context}]`, error);
}
