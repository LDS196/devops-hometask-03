import { expect, test } from '@playwright/test';
import { createTodoViaApi, gotoReliable, resetTodos } from './helpers';

test.beforeEach(async () => {
  await resetTodos();
});

test('opens the detail page via the title link', async ({ page }) => {
  const todo = await createTodoViaApi('Open me');
  await gotoReliable(page, '/');

  const row = page.getByTestId('todo-row').filter({ hasText: 'Open me' });
  await row.getByTestId('todo-title').click();

  await expect(page).toHaveURL(new RegExp(`/todos/${todo.id}$`));
  await expect(page.getByTestId('detail-title')).toHaveValue('Open me');
});

test('edits title and description, then persists after reload', async ({
  page,
}) => {
  const todo = await createTodoViaApi('Original title');
  await gotoReliable(page, `/todos/${todo.id}`);

  await page.getByTestId('detail-title').fill('Edited title');
  await page.getByTestId('detail-description').fill('Some description');
  await page.getByTestId('detail-save').click();

  // toast indicates save
  await expect(page.getByText('Saved', { exact: true })).toBeVisible();

  await page.reload();
  await expect(page.getByTestId('detail-title')).toHaveValue('Edited title');
  await expect(page.getByTestId('detail-description')).toHaveValue(
    'Some description',
  );
});

test('toggles completed state on the detail page', async ({ page }) => {
  const todo = await createTodoViaApi('Mark done');
  await gotoReliable(page, `/todos/${todo.id}`);

  const checkbox = page.getByTestId('detail-completed');
  await expect(checkbox).toHaveAttribute('data-state', 'unchecked');
  await checkbox.click();
  await page.getByTestId('detail-save').click();
  await expect(page.getByText('Saved', { exact: true })).toBeVisible();

  await page.reload();
  await expect(page.getByTestId('detail-completed')).toHaveAttribute(
    'data-state',
    'checked',
  );
});

test('deletes from detail page and navigates back to the list', async ({
  page,
}) => {
  const todo = await createTodoViaApi('Delete from detail');
  await gotoReliable(page, `/todos/${todo.id}`);

  await page.getByTestId('detail-delete').click();
  await page.getByTestId('detail-delete-confirm').click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByTestId('todos-empty')).toBeVisible();
});

test('renders 404 for a non-existent uuid', async ({ page }) => {
  // valid uuid format, just not in db
  await gotoReliable(page, '/todos/00000000-0000-0000-0000-000000000000');
  await expect(page.getByTestId('not-found')).toBeVisible();
});

test('client validation: empty title cannot be saved', async ({ page }) => {
  const todo = await createTodoViaApi('Required title');
  await gotoReliable(page, `/todos/${todo.id}`);

  await page.getByTestId('detail-title').fill('');
  await page.getByTestId('detail-save').click();
  await expect(page.getByTestId('detail-title-error')).toBeVisible();
});
