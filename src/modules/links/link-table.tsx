"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DropdownMenu } from "radix-ui";
import {
  Activity,
  Copy,
  ExternalLink,
  Link2,
  MoreHorizontal,
  Pencil,
  Power,
  QrCode,
  Trash2,
} from "lucide-react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Confirm } from "@/components/shared/confirm";
import { copyText } from "@/components/shared/copy-button";
import { linkOperation } from "./actions";
import type { ManagedLink } from "./service";
import type { LinkStatus } from "./schema";

export const statusLabels: Record<LinkStatus, string> = {
  active: "Ativo",
  inactive: "Inativo",
  expired: "Expirado",
  limited: "Limite atingido",
  blocked: "Bloqueado",
};

function RowMenu({ link }: { link: ManagedLink }) {
  const [confirm, setConfirm] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();
  function run(operation: Parameters<typeof linkOperation>[1]) {
    start(async () => {
      const result = await linkOperation(link.id, operation);
      if (result.ok) {
        toast.success(
          {
            delete: "Link excluído.",
            duplicate: "Cópia inativa criada.",
            activate: "Link ativado.",
            deactivate: "Link desativado.",
          }[operation],
        );
        setConfirm(false);
        router.refresh();
      } else toast.error(result.message);
    });
  }
  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Ações de ${link.title}`}
            disabled={pending}
          >
            <MoreHorizontal size={18} />
          </Button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content className="dropdown" align="end" sideOffset={5}>
            <DropdownMenu.Item
              className="dropdown-item"
              onSelect={() => void copyText(link.shortUrl, "Link copiado.")}
            >
              <Link2 size={16} /> Copiar link
            </DropdownMenu.Item>
            <DropdownMenu.Item className="dropdown-item" asChild>
              <Link href={`/dashboard/links/${link.id}/editar`}>
                <Pencil size={16} /> Editar
              </Link>
            </DropdownMenu.Item>
            <DropdownMenu.Item className="dropdown-item" asChild>
              <Link href={`/dashboard/links/${link.id}`}>
                <Activity size={16} /> Analytics
              </Link>
            </DropdownMenu.Item>
            <DropdownMenu.Item className="dropdown-item" asChild>
              <Link href={`/dashboard/qr?link=${link.id}`}>
                <QrCode size={16} /> QR Code
              </Link>
            </DropdownMenu.Item>
            <DropdownMenu.Item
              className="dropdown-item"
              onSelect={() => run("duplicate")}
            >
              <Copy size={16} /> Duplicar
            </DropdownMenu.Item>
            <DropdownMenu.Item
              className="dropdown-item"
              disabled={link.status === "blocked"}
              onSelect={() => run(link.isActive ? "deactivate" : "activate")}
            >
              <Power size={16} /> {link.isActive ? "Desativar" : "Ativar"}
            </DropdownMenu.Item>
            <DropdownMenu.Separator className="dropdown-divider" />
            <DropdownMenu.Item
              className="dropdown-item error"
              onSelect={() => setConfirm(true)}
            >
              <Trash2 size={16} /> Excluir
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
      <Confirm
        open={confirm}
        setOpen={setConfirm}
        title="Excluir link?"
        description={`O link “${link.title}” e seu histórico de analytics serão removidos permanentemente.`}
        label="Excluir link"
        pending={pending}
        confirm={() => run("delete")}
      />
    </>
  );
}

export function LinkTable({
  links,
  timezone,
}: {
  links: ManagedLink[];
  timezone: string;
}) {
  const formatDate = (date: string | null) =>
    date
      ? new Intl.DateTimeFormat("pt-BR", {
          dateStyle: "short",
          timeZone: timezone,
        }).format(new Date(date))
      : "—";
  const columns: ColumnDef<ManagedLink>[] = [
    {
      id: "title",
      header: "Link",
      cell: ({ row: { original: link } }) => (
        <div className="table-link">
          <Link href={`/dashboard/links/${link.id}`}>{link.title}</Link>
          <a
            href={link.shortUrl}
            target="_blank"
            rel="noreferrer"
            title={link.shortUrl}
          >
            /r/{link.slug} <ExternalLink size={12} />
          </a>
        </div>
      ),
    },
    {
      accessorKey: "destinationUrl",
      header: "Destino",
      cell: ({ row }) => (
        <span className="truncate-value" title={row.original.destinationUrl}>
          {row.original.destinationUrl}
        </span>
      ),
    },
    {
      accessorKey: "clickCount",
      header: "Cliques",
      cell: ({ row }) => row.original.clickCount.toLocaleString("pt-BR"),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <span className={`status-pill ${row.original.status}`}>
          {statusLabels[row.original.status]}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Criação",
      cell: ({ row }) => formatDate(row.original.createdAt),
    },
    {
      accessorKey: "expiresAt",
      header: "Expiração",
      cell: ({ row }) => formatDate(row.original.expiresAt),
    },
    {
      accessorKey: "tags",
      header: "Tags",
      cell: ({ row }) => (
        <div className="tag-line">
          {row.original.tags.map(({ name }) => (
            <span key={name} className="tag">
              {name}
            </span>
          ))}
          {row.original.utm?.utm_campaign && (
            <span className="tag campaign" title="Campanha UTM">
              {row.original.utm.utm_campaign}
            </span>
          )}
        </div>
      ),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Ações</span>,
      cell: ({ row }) => <RowMenu link={row.original} />,
    },
  ];
  // TanStack Table fornece a modelagem das colunas. Ordenação e paginação permanecem no servidor.
  // eslint-disable-next-line react-hooks/incompatible-library -- A instância da tabela fica neste componente.
  const table = useReactTable({
    data: links,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    getRowId: (row) => row.id,
  });
  return (
    <div
      className="table-scroll"
      tabIndex={0}
      role="region"
      aria-label="Tabela de links"
    >
      <table className="data-table">
        <thead>
          {table.getHeaderGroups().map((group) => (
            <tr key={group.id}>
              {group.headers.map((header) => (
                <th key={header.id} scope="col">
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext(),
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
