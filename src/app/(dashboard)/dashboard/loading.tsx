export default function Loading() {
  return (
    <div role="status" className="stack">
      <span className="sr-only">Carregando painel…</span>
      <div className="skeleton w-48 h-9" />
      <div className="skeleton h-32" />
      <div className="skeleton h-64" />
    </div>
  );
}
