export default function Home() {
  return (
    <div className="flex min-h-screen bg-app">
      <aside className="sticky top-0 flex h-screen w-[248px] flex-none flex-col border-r border-line bg-surface px-4 py-6" />
      <main className="h-screen min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[760px] px-10 pt-[34px] pb-20" />
      </main>
    </div>
  );
}
