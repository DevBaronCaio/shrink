"use client";

import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ListQuery } from "./schema";
import { statusLabels } from "./link-table";

export function LinkFilters({
  query,
  tags,
}: {
  query: ListQuery;
  tags: { name: string }[];
}) {
  const router = useRouter();
  const form = useRef<HTMLFormElement>(null);
  const [pending, start] = useTransition();
  const [search, setSearch] = useState(query.q ?? "");
  function filter() {
    if (!form.current || !form.current.reportValidity()) return;
    const params = new URLSearchParams();
    for (const [key, value] of new FormData(form.current))
      if (typeof value === "string" && value.trim())
        params.set(key, value.trim());
    start(() =>
      router.replace(`/dashboard/links${params.size ? `?${params}` : ""}`, {
        scroll: false,
      }),
    );
  }
  useEffect(() => {
    if (search === (query.q ?? "")) return;
    const timeout = setTimeout(() => {
      if (!form.current || !form.current.checkValidity()) return;
      const params = new URLSearchParams();
      for (const [key, value] of new FormData(form.current))
        if (typeof value === "string" && value.trim())
          params.set(key, value.trim());
      start(() =>
        router.replace(`/dashboard/links${params.size ? `?${params}` : ""}`, {
          scroll: false,
        }),
      );
    }, 350);
    return () => clearTimeout(timeout);
  }, [query.q, router, search]);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    filter();
  }

  return (
    <form
      ref={form}
      onSubmit={submit}
      className="panel filters"
      aria-label="Filtrar links"
      aria-busy={pending}
    >
      <div className="field grow">
        <label htmlFor="filter-search">Buscar</label>
        <div className="search-wrap">
          <Search size={16} />
          <Input
            id="filter-search"
            name="q"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Título, slug ou destino"
            maxLength={150}
          />
        </div>
      </div>
      <div className="field">
        <label htmlFor="filter-status">Status</label>
        <select
          className="input"
          id="filter-status"
          name="status"
          defaultValue={query.status ?? ""}
        >
          <option value="">Todos</option>
          {Object.entries(statusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="filter-tag">Tag</label>
        <select
          className="input"
          id="filter-tag"
          name="tag"
          defaultValue={query.tag ?? ""}
        >
          <option value="">Todas</option>
          {tags.map(({ name }) => (
            <option key={name}>{name}</option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="filter-campaign">Campanha</label>
        <Input
          id="filter-campaign"
          name="campaign"
          maxLength={200}
          defaultValue={query.campaign}
          placeholder="Todas"
        />
      </div>
      <div className="field">
        <label htmlFor="filter-from">Criado a partir de</label>
        <Input
          id="filter-from"
          type="date"
          name="from"
          defaultValue={query.from}
        />
      </div>
      <div className="field">
        <label htmlFor="filter-to">Criado até</label>
        <Input id="filter-to" type="date" name="to" defaultValue={query.to} />
      </div>
      <div className="field">
        <label htmlFor="filter-sort">Ordenar</label>
        <select
          className="input"
          id="filter-sort"
          name="sort"
          defaultValue={query.sort}
        >
          <option value="newest">Mais recentes</option>
          <option value="oldest">Mais antigos</option>
          <option value="clicks">Mais clicados</option>
        </select>
      </div>
      <Button variant="outline" type="submit" disabled={pending}>
        {pending ? "Filtrando…" : "Filtrar"}
      </Button>
    </form>
  );
}
