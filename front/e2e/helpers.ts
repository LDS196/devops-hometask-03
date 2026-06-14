/// <reference types="node" />

import {
  request,
  type APIRequestContext,
  type Page,
} from '@playwright/test';

const gotoOptions = { waitUntil: 'domcontentloaded' } as const;

const isTransientNavigationError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  return /ERR_CONNECTION_CLOSED|ERR_ABORTED|ERR_CONNECTION_RESET|ERR_NETWORK_CHANGED|Timeout \d+ms exceeded/.test(
    message,
  );
};

/** Retry page.goto on flaky network errors against deployed HTTPS. */
export async function gotoReliable(
  page: Page,
  url: string,
  options: Parameters<Page['goto']>[1] = gotoOptions,
) {
  const attempts = process.env.E2E_BASE_URL ? 6 : 1;
  const attemptTimeout = process.env.E2E_BASE_URL ? 12_000 : options?.timeout;
  const retryDelayMs = 1_000;

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      await page.goto(url, { ...options, timeout: attemptTimeout });
      return;
    } catch (error) {
      if (attempt === attempts - 1 || !isTransientNavigationError(error)) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
    }
  }
}

const API = process.env.E2E_API_URL ?? 'http://localhost:3000';

// Курсовой shared-токен. То же значение прошито в back/src/test-reset/test-reset.controller.ts.
const E2E_RESET_TOKEN = 'e2e-reset-course-DevOps-2026';

const waitForResetPropagation = () =>
  new Promise((resolve) => setTimeout(resolve, 100));

/**
 * Wipe all todos via the protected reset endpoint so each test starts
 * from a clean state. Works against any environment (local or deployed).
 */
export async function resetTodos(api?: APIRequestContext) {
  const ctx = api ?? (await request.newContext());
  const res = await ctx.post(`${API}/test/reset`, {
    headers: { 'x-e2e-reset-token': E2E_RESET_TOKEN },
  });
  if (!res.ok()) {
    throw new Error(`Reset failed: ${res.status()} ${res.statusText()}`);
  }
  await waitForResetPropagation();
  if (!api) await ctx.dispose();
}

export async function createTodoViaApi(
  title: string,
  description?: string,
): Promise<{ id: string; title: string; description: string | null }> {
  const ctx = await request.newContext();
  const res = await ctx.post(`${API}/todos`, {
    data: { title, ...(description ? { description } : {}) },
  });
  if (!res.ok()) {
    throw new Error(`Failed to create todo: ${res.status()}`);
  }
  const json = await res.json();
  await ctx.dispose();
  return json;
}
