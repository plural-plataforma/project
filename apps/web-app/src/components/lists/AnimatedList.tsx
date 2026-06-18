import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { LIST_STAGGER_MS, listContainerClass } from './listStyles'

interface AnimatedListProps {
  children: React.ReactNode
  className?: string
}

export function AnimatedList({ children, className }: AnimatedListProps) {
  return (
    <div className={cn(listContainerClass, className)}>
      <AnimatePresence initial={false}>{children}</AnimatePresence>
    </div>
  )
}

interface AnimatedListItemProps {
  itemKey: string | number
  index: number
  children: React.ReactNode
  className?: string
}

export function AnimatedListItem({ itemKey, index, children, className }: AnimatedListItemProps) {
  return (
    <motion.div
      key={itemKey}
      className={className}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.25, delay: index * (LIST_STAGGER_MS / 1000) }}
    >
      {children}
    </motion.div>
  )
}
