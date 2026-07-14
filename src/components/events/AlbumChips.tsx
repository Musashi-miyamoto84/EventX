import { Plus, Trash2 } from 'lucide-react'
import { motion } from 'framer-motion'
import type { AlbumItem } from '../../lib/types'
import { uk } from '../../lib/i18n/uk'

interface Props {
  albums: AlbumItem[]
  albumId?: string
  onSelect: (id?: string) => void
  onDelete?: (id: string) => void
  showHint?: boolean
  canManage?: boolean
}

export function AlbumChips({
  albums,
  albumId,
  onSelect,
  onDelete,
  showHint,
  canManage,
}: Props) {
  return (
    <div className="space-y-2">
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
        <Chip active={!albumId} onClick={() => onSelect(undefined)}>
          {uk.guest.allAlbums}
        </Chip>
        {albums.map((album) => (
          <div key={album.id} className="shrink-0 flex items-center gap-1">
            <Chip active={albumId === album.id} onClick={() => onSelect(album.id)}>
              {album.name}
            </Chip>
            {canManage && onDelete && albumId === album.id && (
              <motion.button
                type="button"
                whileTap={{ scale: 0.92 }}
                onClick={() => onDelete(album.id)}
                className="min-h-[40px] min-w-[40px] rounded-full bg-red-50 text-red-500 flex items-center justify-center border border-red-100"
                aria-label={uk.event.deleteAlbum}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </motion.button>
            )}
          </div>
        ))}
      </div>
      {showHint && albums.length === 0 && (
        <p className="text-xs text-espresso/45 px-0.5">{uk.guest.noCustomAlbums}</p>
      )}
    </div>
  )
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className={`
        shrink-0 min-h-[40px] px-4 py-2 rounded-full text-sm font-medium
        transition-colors duration-200 border
        ${
          active
            ? 'bg-espresso text-white border-espresso shadow-sm shadow-espresso/15'
            : 'bg-white/80 text-espresso/70 border-champagne hover:border-rose/40 hover:text-espresso'
        }
      `}
    >
      {children}
    </motion.button>
  )
}

interface AddAlbumProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
}

export function AddAlbumForm({ value, onChange, onSubmit }: AddAlbumProps) {
  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit()
      }}
    >
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={uk.event.albumNamePlaceholder}
        className="
          flex-1 min-h-[48px] px-4 rounded-2xl bg-white border border-champagne
          text-sm text-espresso placeholder:text-espresso/35
          focus:outline-none focus:ring-2 focus:ring-rose/25 focus:border-rose/50
        "
      />
      <motion.button
        type="submit"
        whileTap={{ scale: 0.95 }}
        className="
          shrink-0 min-h-[48px] min-w-[48px] rounded-2xl
          bg-rose-light text-rose flex items-center justify-center
          hover:bg-rose hover:text-white transition-colors
        "
        aria-label={uk.event.addAlbum}
      >
        <Plus className="w-5 h-5" />
      </motion.button>
    </form>
  )
}
