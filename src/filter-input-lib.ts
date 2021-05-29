export const FILTER_INPUT_KEY = 'filterInput' as const;

export function getFilterInputId(frameId: string): string {
  return `${frameId}-filterInput`;
}
