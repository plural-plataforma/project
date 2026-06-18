import { SkeletonList } from '@/components/common/SkeletonCard'

interface ListPageLayoutProps {
  isLoading?: boolean
  skeletonCount?: number
  isEmpty?: boolean
  empty?: React.ReactNode
  banner?: React.ReactNode
  filters?: React.ReactNode
  toolbar?: React.ReactNode
  children?: React.ReactNode
}

/** Esqueleto padrão para páginas com lista: banner → filtros → toolbar → loading/empty/conteúdo. */
export function ListPageLayout({
  isLoading = false,
  skeletonCount = 3,
  isEmpty = false,
  empty,
  banner,
  filters,
  toolbar,
  children,
}: ListPageLayoutProps) {
  return (
    <>
      {banner}
      {filters}
      {!isLoading && !isEmpty && toolbar}
      {isLoading ? (
        <SkeletonList count={skeletonCount} />
      ) : isEmpty ? (
        empty
      ) : (
        children
      )}
    </>
  )
}
