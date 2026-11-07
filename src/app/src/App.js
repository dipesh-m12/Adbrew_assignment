import { useCallback, useEffect, useState } from 'react';
import './App.css';
import { createTodo, getTodos } from './api';

export function App() {
  const [todos, setTodos] = useState([]);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const refreshTodos = useCallback(async () => {
    setLoading(true);
    try {
      setTodos(await getTodos());
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshTodos();
  }, [refreshTodos]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!description.trim() || loading || submitting) return;

    setSubmitting(true);
    setError('');
    try {
      await createTodo(description.trim());
      setDescription('');
      await refreshTodos();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="App">
      <h1>TODOs</h1>

      <form onSubmit={handleSubmit}>
        <label htmlFor="todo">New TODO</label>
        <input
          id="todo"
          type="text"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={500}
          required
        />
        <button type="submit" disabled={loading || submitting || !description.trim()}>
          {submitting ? 'Adding…' : 'Add TODO'}
        </button>
      </form>

      {error && <p role="alert">{error}</p>}
      {loading ? (
        <p>Loading TODOs…</p>
      ) : todos.length === 0 ? (
        <p>No TODOs yet.</p>
      ) : (
        <ul>
          {todos.map((todo) => <li key={todo.id}>{todo.description}</li>)}
        </ul>
      )}
    </main>
  );
}

export default App;
