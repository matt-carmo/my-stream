"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui"
import { cn } from "@/lib/utils"

type ParamSelectProps = {
  param: string
  value: string
  defaultValue: string
  options: readonly { value: string; label: string }[]
  className?: string
}

export function ParamSelect({ param, value, defaultValue, options, className }: ParamSelectProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function handleChange(next: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (!next || next === defaultValue) {
      params.delete(param)
    } else {
      params.set(param, next)
    }
    params.delete("page")
    router.push(`?${params.toString()}`)
  }

  return (
    <Select value={value} onValueChange={handleChange}>
      <SelectTrigger className={cn("w-40", className)}>
        <SelectValue>{options.find((o) => o.value === value)?.label}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
