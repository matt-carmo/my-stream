import { ParamSelect } from "@/components/param-select"
import { DEFAULT_PER_PAGE, PER_PAGE_OPTIONS } from "@/lib/pagination"

const OPTIONS = PER_PAGE_OPTIONS.map((o) => ({ value: String(o), label: `${o} per page` }))

export function PerPageSelect({ value }: { value: number }) {
  return (
    <ParamSelect
      param="per_page"
      value={String(value)}
      defaultValue={String(DEFAULT_PER_PAGE)}
      options={OPTIONS}
      className="w-32"
    />
  )
}
