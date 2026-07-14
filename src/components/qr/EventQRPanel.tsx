import { useRef, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Copy, Download, Check, Share2 } from 'lucide-react'
import { Button } from '../ui/Button'
import { uk } from '../../lib/i18n/uk'

interface Props {
  code: string
  eventName: string
}

export function EventQRPanel({ code, eventName }: Props) {
  const svgRef = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)
  const guestUrl = `${window.location.origin}/e/${code}`

  const copyLink = async () => {
    await navigator.clipboard.writeText(guestUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: eventName,
          text: `Фото з події «${eventName}»`,
          url: guestUrl,
        })
        return
      } catch {
        // user cancelled — fall through to copy
      }
    }
    await copyLink()
  }

  const downloadQr = () => {
    const svg = svgRef.current?.querySelector('svg')
    if (!svg) return
    const serializer = new XMLSerializer()
    const source = serializer.serializeToString(svg)
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `eventoly-${code}.svg`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="bg-white/95 rounded-3xl border border-champagne/70 p-5 shadow-[0_12px_40px_-24px_rgba(45,31,29,0.45)]">
      <p className="text-sm font-semibold text-espresso mb-1 truncate">{eventName}</p>
      <p className="text-xs text-espresso/50 mb-4">
        {uk.event.code}:{' '}
        <span className="font-mono font-semibold text-rose tracking-wider">{code}</span>
      </p>

      <div
        ref={svgRef}
        className="mx-auto w-fit p-4 rounded-2xl border border-rose-light bg-ivory mb-4"
      >
        <QRCodeSVG value={guestUrl} size={180} level="H" includeMargin />
      </div>

      <div className="flex flex-col gap-2">
        <Button variant="secondary" fullWidth type="button" onClick={shareNative}>
          {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
          {copied ? uk.event.copied : uk.event.shareNative}
        </Button>
        <Button variant="ghost" fullWidth type="button" onClick={copyLink}>
          <Copy className="w-4 h-4" />
          {uk.event.shareLink}
        </Button>
        <Button fullWidth type="button" onClick={downloadQr}>
          <Download className="w-4 h-4" />
          {uk.event.downloadQr}
        </Button>
      </div>
    </div>
  )
}
