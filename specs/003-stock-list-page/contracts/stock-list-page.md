# Contract: Stock List Page

## Purpose

Define the internal UI contract between the server-fetched list page and the
stock-list component set.

## Route Contract

### Route

`/lists/[type]`

### Supported `type`

- `blue-chips`
- `all`

### Invalid `type`

- Redirect to `/lists/blue-chips`

## URL Parameter Contract

All parameters are optional and URL-backed.

| Parameter | Type | Allowed Values | Default |
| --- | --- | --- | --- |
| `sector` | string | exact company sector match | none |
| `sort` | string | `percent_change`, `price`, `name` | `percent_change` |
| `order` | string | `asc`, `desc` | `desc` |
| `page` | integer | `>= 1`, clamped to valid range | `1` |
| `search` | string | free text | empty |

## Server Page Input Contract

`page.tsx` must await:

```ts
type StockListSearchParams = Promise<{
  sector?: string;
  sort?: string;
  order?: string;
  search?: string;
  page?: string;
}>;
```

The route `params` object must also be awaited in Next.js 15.

## Server-to-Client Shell Contract

`StockListShell` receives:

- `type`
- `sector`
- `search`
- `sort`
- `order`
- `page`
- `sectorOptions`

It does not fetch data and does not own rendered stock entries.

## Stock Card Contract

Each rendered card receives:

- `symbol`
- `companyName`
- `sector`
- `logoUrl`
- `closePrice`
- `percentChange`
- `minimumInvestment`

### Display Rules

- `closePrice = null` renders as `—`
- `percentChange = null` renders as `—`
- `minimumInvestment = null` renders as `—`
- Missing `logoUrl` renders a placeholder
- Card links to `/stocks/[symbol]`

## Empty State Contract

Shown when the filtered query returns zero rows.

Must:

- explain that no stocks match the current filters
- suggest clearing search or changing sector
- not imply a backend failure

## Pagination Contract

- 25 stocks per page
- out-of-range pages clamp to nearest valid page
- page navigation preserves all other URL parameters

## Data Delay Contract

The list experience must show the message:

`Data delayed 15 minutes`

## Beginner Language Contract

The page must provide plain Filipino explanations for:

- board lot
- percent change
