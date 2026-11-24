import { z } from "zod";
import { appUrl } from "@/config/site";
import { createLinkSchema } from "@/modules/links/schema";

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
const json = (schema: object, example?: object) => ({
  "application/json": { schema, ...(example ? { example } : {}) },
});
const str = (properties: object = {}) => ({ type: "string", ...properties });
const integer = (properties: object = {}) => ({
  type: "integer",
  ...properties,
});
const nullable = (schema: object) => ({ anyOf: [schema, { type: "null" }] });
const array = (items: object) => ({ type: "array", items });
const object = (
  properties: Record<string, object>,
  required = Object.keys(properties),
) => ({ type: "object", properties, required });
const property = (name: string, schema: object, description: string) => ({
  name,
  in: "query",
  schema,
  description,
});
const date = str({ format: "date" });
const datetime = str({ format: "date-time" });

const id = {
  name: "id",
  in: "path",
  required: true,
  schema: str(),
  description: "Identificador do link.",
};
const filters = [
  property("q", str({ maxLength: 150 }), "Busca por título, slug ou destino."),
  property("status", ref("LinkStatus"), "Status efetivo do link."),
  property("tag", str({ maxLength: 32 }), "Nome da tag."),
  property("campaign", str({ maxLength: 200 }), "Nome exato da campanha UTM."),
  property("from", date, "Criação a partir desta data, em UTC."),
  property("to", date, "Criação até esta data, inclusive em UTC."),
  property(
    "sort",
    str({ enum: ["newest", "oldest", "clicks"], default: "newest" }),
    "Ordenação.",
  ),
  property(
    "page",
    integer({ minimum: 1, maximum: 10000, default: 1 }),
    "Página a partir de 1.",
  ),
  property(
    "limit",
    integer({ minimum: 1, maximum: 100, default: 20 }),
    "Itens por página.",
  ),
];
const periods = [
  property(
    "period",
    str({ enum: ["today", "7d", "30d", "90d", "custom"], default: "30d" }),
    "Período no fuso da conta.",
  ),
  property("from", date, "Início inclusivo do período custom."),
  property("to", date, "Fim inclusivo do período custom, até 90 dias."),
  property(
    "traffic",
    str({ enum: ["all", "non-bot", "bot"], default: "all" }),
    "Classificação estimada do tráfego.",
  ),
];

const errors = {
  400: ["JSON inválido.", "INVALID_JSON"],
  401: ["Chave ausente, inválida, expirada ou revogada.", "UNAUTHORIZED"],
  403: ["O escopo da chave não autoriza a operação.", "INSUFFICIENT_SCOPE"],
  404: ["Recurso inexistente ou inacessível.", "NOT_FOUND"],
  409: ["Slug já utilizado.", "SLUG_CONFLICT"],
  413: ["Corpo maior que 16 KiB.", "PAYLOAD_TOO_LARGE"],
  415: ["Tipo de conteúdo inválido.", "UNSUPPORTED_MEDIA_TYPE"],
  422: ["Dados ou parâmetros inválidos.", "VALIDATION_ERROR"],
  429: ["Limite de requisições atingido.", "RATE_LIMITED"],
  500: ["Falha interna.", "INTERNAL_ERROR"],
  503: ["Operação temporariamente indisponível.", "SLUG_UNAVAILABLE"],
} as const;

const requestId = {
  "X-Request-Id": {
    schema: str({ format: "uuid" }),
    description: "Identificador da requisição.",
  },
};
const rateHeaders = {
  "X-RateLimit-Limit": { schema: integer(), description: "Limite da janela." },
  "X-RateLimit-Remaining": {
    schema: integer(),
    description: "Requisições restantes.",
  },
  "X-RateLimit-Reset": {
    schema: integer(),
    description: "Unix time em segundos da próxima janela.",
  },
};

function errorResponses(...statuses: (keyof typeof errors)[]) {
  return Object.fromEntries(
    [
      ...new Set([401, 403, 429, 500, ...statuses] as (keyof typeof errors)[]),
    ].map((status) => {
      const [description, code] = errors[status];
      const extra =
        status === 429
          ? {
              ...rateHeaders,
              "Retry-After": {
                schema: integer(),
                description: "Segundos até a próxima janela.",
              },
            }
          : status === 401
            ? { "WWW-Authenticate": { schema: str() } }
            : {};
      return [
        status,
        {
          description,
          headers: { ...requestId, ...extra },
          content: json(ref("Error"), {
            error: { code, message: description },
            requestId: "1db34ca4-2beb-4e61-99b8-a12c52c8ef4a",
          }),
        },
      ];
    }),
  );
}

const input = {
  title: "Guia",
  destinationUrl: "https://example.com/guia",
  slug: "guia-2026",
  tags: ["docs"],
};
const breakdown = array(object({ label: nullable(str()), clicks: integer() }));
const linkExample = {
  ...input,
  id: "cm3je0f9h0001ic95rnc9jru6",
  description: null,
  isActive: true,
  expiresAt: null,
  clickLimit: null,
  clickCount: 0,
  shortUrl: "https://shrink-example.vercel.app/r/guia-2026",
  status: "active",
  tags: [{ name: "docs", color: "#FACC15" }],
  utm: null,
  qr: null,
  qrCreatedAt: null,
  createdAt: "2026-11-23T10:00:00Z",
  updatedAt: "2026-11-23T10:00:00Z",
};
const analyticsExample = {
  period: { from: "2026-11-23", to: "2026-11-23", timezone: "America/Belem" },
  clicks: 2,
  bots: 0,
  nonBotClicks: 2,
  uniqueVisitors: null,
  previousClicks: 1,
  changePercent: 100,
  series: [{ day: "2026-11-23", clicks: 2, bots: 0 }],
  dimensions: {
    country: [{ label: "BR", clicks: 2 }],
    region: [],
    device: [],
    browser: [],
    operatingSystem: [],
    referrer: [{ label: null, clicks: 2 }],
  },
  topLinks: [
    {
      id: linkExample.id,
      title: linkExample.title,
      slug: linkExample.slug,
      clicks: 2,
    },
  ],
};

const wrap = (data: object) => object({ data });
const success = (
  description: string,
  schema: object,
  example: object,
  extra?: Record<string, object>,
) => ({
  description,
  headers: { ...requestId, ...rateHeaders, ...extra },
  content: json(schema, example),
});
const create = z.toJSONSchema(createLinkSchema, { io: "input" });
const { $schema: dialect, required, ...update } = create;
void dialect;
void required;

export function openapi() {
  return {
    openapi: "3.1.0",
    info: {
      title: "Shrink API",
      version: "1.0.0",
      description:
        "API REST para criação de links e leitura de analytics. Envie a chave no cabeçalho Authorization: Bearer. As janelas fixas permitem 120 requisições por chave por minuto, 600 por rede por minuto e 30 criações por conta por hora, incluindo as criações no dashboard.",
    },
    servers: [{ url: appUrl() }],
    security: [{ apiKey: [] }],
    tags: [{ name: "Links" }, { name: "Analytics" }, { name: "Sistema" }],
    paths: {
      "/api/v1/links": {
        post: {
          tags: ["Links"],
          operationId: "createLink",
          summary: "Criar link",
          description: "Requer escopo WRITE.",
          requestBody: {
            required: true,
            content: json(ref("LinkCreate"), input),
          },
          responses: {
            201: success(
              "Link criado.",
              wrap(ref("Link")),
              { data: linkExample },
              {
                Location: {
                  schema: str(),
                  description: "Caminho do recurso criado.",
                },
              },
            ),
            ...errorResponses(400, 409, 413, 415, 422, 503),
          },
        },
        get: {
          tags: ["Links"],
          operationId: "listLinks",
          summary: "Listar links",
          description: "Requer escopo READ.",
          parameters: filters,
          responses: {
            200: success(
              "Página de links.",
              object({ data: array(ref("Link")), meta: ref("Pagination") }),
              {
                data: [linkExample],
                meta: { page: 1, limit: 20, total: 1, pages: 1 },
              },
            ),
            ...errorResponses(422),
          },
        },
      },
      "/api/v1/links/{id}": {
        parameters: [id],
        get: {
          tags: ["Links"],
          operationId: "getLink",
          summary: "Consultar link",
          description: "Requer escopo READ.",
          responses: {
            200: success("Link encontrado.", wrap(ref("Link")), {
              data: linkExample,
            }),
            ...errorResponses(404),
          },
        },
        patch: {
          tags: ["Links"],
          operationId: "updateLink",
          summary: "Editar link",
          description:
            "Requer escopo WRITE. Campos ausentes mantêm o valor atual.",
          requestBody: {
            required: true,
            content: json(ref("LinkUpdate"), { title: "Guia atualizado" }),
          },
          responses: {
            200: success("Link editado.", wrap(ref("Link")), {
              data: { ...linkExample, title: "Guia atualizado" },
            }),
            ...errorResponses(400, 404, 409, 413, 415, 422),
          },
        },
        delete: {
          tags: ["Links"],
          operationId: "deleteLink",
          summary: "Excluir link",
          description: "Requer escopo WRITE. Remove o link e seus eventos.",
          responses: {
            204: {
              description: "Link excluído, sem corpo.",
              headers: { ...requestId, ...rateHeaders },
            },
            ...errorResponses(404),
          },
        },
      },
      "/api/v1/links/{id}/analytics": {
        get: {
          tags: ["Analytics"],
          operationId: "linkAnalytics",
          summary: "Consultar analytics do link",
          description: "Requer escopo READ.",
          parameters: [id, ...periods],
          responses: {
            200: success("Analytics do link.", wrap(ref("Analytics")), {
              data: analyticsExample,
            }),
            ...errorResponses(404, 422),
          },
        },
      },
      "/api/v1/analytics": {
        get: {
          tags: ["Analytics"],
          operationId: "analytics",
          summary: "Consultar analytics da conta",
          description: "Requer escopo READ.",
          parameters: periods,
          responses: {
            200: success("Analytics da conta.", wrap(ref("Analytics")), {
              data: analyticsExample,
            }),
            ...errorResponses(422),
          },
        },
      },
      "/api/health": {
        get: {
          tags: ["Sistema"],
          operationId: "health",
          summary: "Consultar disponibilidade",
          security: [],
          responses: {
            200: {
              description: "Disponível.",
              headers: requestId,
              content: json(object({ status: { const: "ok" } }), {
                status: "ok",
              }),
            },
            503: {
              description: "Indisponível.",
              headers: requestId,
              content: json(object({ status: { const: "unavailable" } }), {
                status: "unavailable",
              }),
            },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        apiKey: {
          type: "http",
          scheme: "bearer",
          description: "Chave gerada no dashboard, exibida somente na criação.",
        },
      },
      schemas: {
        LinkCreate: { ...update, required },
        LinkUpdate: { ...update, minProperties: 1 },
        LinkStatus: str({
          enum: ["active", "inactive", "expired", "limited", "blocked"],
        }),
        Link: object({
          id: str(),
          title: str(),
          destinationUrl: str({ format: "uri" }),
          shortUrl: str({ format: "uri" }),
          slug: str(),
          description: nullable(str()),
          isActive: { type: "boolean" },
          clickLimit: nullable(integer()),
          clickCount: integer(),
          status: ref("LinkStatus"),
          expiresAt: nullable(datetime),
          createdAt: datetime,
          updatedAt: datetime,
          tags: array(object({ name: str(), color: str() })),
          utm: nullable({ type: "object", additionalProperties: str() }),
          qr: nullable(
            object({ foreground: str(), background: str(), size: integer() }),
          ),
          qrCreatedAt: nullable(datetime),
        }),
        Pagination: object({
          page: integer(),
          limit: integer(),
          total: integer(),
          pages: integer(),
        }),
        Analytics: object({
          period: object({ from: date, to: date, timezone: str() }),
          clicks: integer(),
          bots: integer(),
          nonBotClicks: integer(),
          uniqueVisitors: nullable(integer()),
          previousClicks: nullable(integer()),
          changePercent: nullable({ type: "number" }),
          series: array(
            object({ day: date, clicks: integer(), bots: integer() }),
          ),
          dimensions: object({
            country: breakdown,
            region: breakdown,
            device: breakdown,
            browser: breakdown,
            operatingSystem: breakdown,
            referrer: breakdown,
          }),
          topLinks: array(
            object({ id: str(), slug: str(), title: str(), clicks: integer() }),
          ),
        }),
        Error: object({
          error: object(
            {
              code: str(),
              message: str(),
              details: array(object({ path: str(), code: str() })),
            },
            ["code", "message"],
          ),
          requestId: str({ format: "uuid" }),
        }),
      },
    },
  };
}
