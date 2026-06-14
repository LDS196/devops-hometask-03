import { expect, test } from '@playwright/test';
import { gotoReliable, resetTodos } from './helpers';

test.beforeEach(async () => {
  await resetTodos();
});

test('shows empty state when there are no todos', async ({ page }) => {
  await gotoReliable(page, '/');
  await expect(page.getByTestId('todos-empty')).toBeVisible();
  await expect(page.getByTestId('todos-empty')).toHaveText(
    /No todos yet/i,
  );
});

test('creates a todo via the inline form and clears the input', async ({
  page,
}) => {
  await gotoReliable(page, '/');
  await page.getByTestId('create-title').fill('Buy milk');
  await page.getByTestId('create-submit').click();

  const row = page.getByTestId('todo-row').filter({ hasText: 'Buy milk' });
  await expect(row).toBeVisible();
  await expect(page.getByTestId('create-title')).toHaveValue('');
});

test('rejects empty title with a client-side error', async ({ page }) => {
  await gotoReliable(page, '/');
  await page.getByTestId('create-submit').click();
  await expect(page.getByTestId('create-error')).toBeVisible();
  await expect(page.getByTestId('todos-empty')).toBeVisible();
});

test('toggles completion from the list row', async ({ page }) => {
  await gotoReliable(page, '/');
  await page.getByTestId('create-title').fill('Toggle me');
  await page.getByTestId('create-submit').click();

  const row = page
    .getByTestId('todo-row')
    .filter({ hasText: 'Toggle me' });
  const toggle = row.getByTestId('todo-toggle');
  await toggle.click();
  await expect(toggle).toHaveAttribute('data-state', 'checked');

  // strikethrough applied
  await expect(row.getByTestId('todo-title')).toHaveClass(/line-through/);
});

test('deletes a todo after confirming', async ({ page }) => {
  await gotoReliable(page, '/');
  await page.getByTestId('create-title').fill('Delete me');
  await page.getByTestId('create-submit').click();

  const row = page
    .getByTestId('todo-row')
    .filter({ hasText: 'Delete me' });
  await row.getByTestId('todo-delete').click();
  await page.getByTestId('todo-delete-confirm').click();

  await expect(row).toHaveCount(0);
  await expect(page.getByTestId('todos-empty')).toBeVisible();
});
