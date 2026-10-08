export const PER_PAGE_OPTIONS = [20, 40, 60] as const
export const DEFAULT_PER_PAGE = 20

export function parsePerPage(value: string | undefined) {
  return PER_PAGE_OPTIONS.find((o) => o === Number(value)) ?? DEFAULT_PER_PAGE
}

export function parsePage(value: string | undefined, maxPage: number) {
  return Math.min(Math.max(1, Number(value) || 1), Math.max(1, maxPage))
}
