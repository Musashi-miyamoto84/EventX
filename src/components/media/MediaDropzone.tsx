import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, Loader2 } from 'lucide-react'
import { uk } from '../../lib/i18n/uk'

interface Props {
  onFiles: (files: File[]) => Promise<void> | void
  disabled?: boolean
}

export function MediaDropzone({ onFiles, disabled }: Props) {
  const [uploading, setUploading] = useState(false)

  const onDrop = useCallback(
    async (accepted: File[]) => {
      if (!accepted.length || disabled) return
      setUploading(true)
      try {
        await onFiles(accepted)
      } finally {
        setUploading(false)
      }
    },
    [onFiles, disabled],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [], 'video/*': [] },
    multiple: true,
    disabled: disabled || uploading,
  })

  return (
    <div
      {...getRootProps()}
      className={`
        border-2 border-dashed rounded-3xl p-7 sm:p-10 text-center cursor-pointer
        transition-all duration-300 active:scale-[0.995]
        ${isDragActive ? 'border-rose bg-rose-light/35 scale-[1.01]' : 'border-champagne bg-white/70'}
        ${disabled || uploading ? 'opacity-60 pointer-events-none' : 'hover:bg-pearl/60'}
      `}
    >
      <input {...getInputProps()} />
      <div className="w-14 h-14 rounded-2xl bg-rose-light/80 flex items-center justify-center mx-auto mb-4">
        {uploading ? (
          <Loader2 className="w-7 h-7 text-rose animate-spin" />
        ) : (
          <Upload className="w-7 h-7 text-rose" />
        )}
      </div>
      <p className="text-sm font-medium text-espresso mb-1.5 px-2">
        {uploading ? uk.auth.loading : uk.event.uploadHint}
      </p>
    </div>
  )
}
