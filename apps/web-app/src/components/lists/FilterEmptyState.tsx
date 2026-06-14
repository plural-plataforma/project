import { EmptyState } from '@/components/common/EmptyState'

interface FilterEmptyStateProps {
  icon?: React.ReactNode
  hasActiveFilters: boolean
  filteredTitle: string
  filteredDescription?: string
  defaultTitle: string
  defaultDescription?: string
  defaultAction?: React.ReactNode
}

/** Empty state que distingue lista vazia global vs. resultado de filtro/busca. */
export function FilterEmptyState({
  icon,
  hasActiveFilters,
  filteredTitle,
  filteredDescription = 'Tente outro termo de busca.',
  defaultTitle,
  defaultDescription,
  defaultAction,
}: FilterEmptyStateProps) {
  return (
    <EmptyState
      icon={icon}
      title={hasActiveFilters ? filteredTitle : defaultTitle}
      description={hasActiveFilters ? filteredDescription : defaultDescription}
      action={hasActiveFilters ? undefined : defaultAction}
    />
  )
}
