import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { createTodo, getTodos } from './api';

jest.mock('./api');

beforeEach(() => {
  jest.resetAllMocks();
});

test('loads TODOs from the API', async () => {
  getTodos.mockResolvedValue([{ id: '1', description: 'Learn Docker' }]);
  render(<App />);
  expect(await screen.findByText('Learn Docker')).toBeInTheDocument();
  expect(getTodos).toHaveBeenCalledTimes(1);
});

test('creates a TODO and reloads the list', async () => {
  getTodos
    .mockResolvedValueOnce([])
    .mockResolvedValueOnce([{ id: '2', description: 'Learn React' }]);
  createTodo.mockResolvedValue({ id: '2', description: 'Learn React' });

  render(<App />);
  await screen.findByText('No TODOs yet.');
  await userEvent.type(screen.getByLabelText('New TODO'), 'Learn React');
  userEvent.click(screen.getByRole('button', { name: 'Add TODO' }));

  expect(await screen.findByText('Learn React')).toBeInTheDocument();
  expect(createTodo).toHaveBeenCalledWith('Learn React');
  await waitFor(() => expect(getTodos).toHaveBeenCalledTimes(2));
});

test('shows a load error instead of crashing', async () => {
  getTodos.mockRejectedValue(new Error('Cannot reach the TODO API.'));

  render(<App />);

  expect(await screen.findByRole('alert')).toHaveTextContent('Cannot reach the TODO API.');
});

test('keeps the description when saving fails', async () => {
  getTodos.mockResolvedValue([]);
  createTodo.mockRejectedValue(new Error('Could not save TODO.'));

  render(<App />);
  await screen.findByText('No TODOs yet.');
  await userEvent.type(screen.getByLabelText('New TODO'), 'Try again');
  userEvent.click(screen.getByRole('button', { name: 'Add TODO' }));

  expect(await screen.findByRole('alert')).toHaveTextContent('Could not save TODO.');
  expect(screen.getByLabelText('New TODO')).toHaveValue('Try again');
});
