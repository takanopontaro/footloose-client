export const LOG_KEY = 'log' as const;

export function getLastLogEl(): HTMLElement | null {
  return document.querySelector(`#${LOG_KEY} .log:last-child`);
}
