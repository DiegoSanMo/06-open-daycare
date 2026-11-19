import { Suspense } from "react";
import { createClient } from "@/utils/supabase/server";

async function TodoList() {
  const supabase = await createClient();
  const { data: todos, error } = await supabase.from("todos").select();

  if (error) {
    return (
      <p role="alert" className="text-brand">
        No se pudieron cargar los todos: {error.message}
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {todos?.map((todo) => (
        <li key={todo.id} className="rounded-lg bg-surface px-4 py-3 text-ink-body">
          {todo.name}
        </li>
      ))}
    </ul>
  );
}

export default function TodosPage() {
  return (
    <main className="mx-auto max-w-[760px] px-5 py-10">
      <h1 className="font-display text-[30px] font-semibold text-ink">Todos</h1>
      <Suspense fallback={<p className="text-muted">Cargando…</p>}>
        <TodoList />
      </Suspense>
    </main>
  );
}
