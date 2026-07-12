import { Heart } from 'lucide-react'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = {
  sm: 'text-2xl',
  md: 'text-3xl',
  lg: 'text-4xl',
}

export function Logo({ size = 'md', className = '' }: LogoProps) {
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <span
        className={`font-display italic font-semibold text-espresso ${sizes[size]}`}
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Eventoly
      </span>
      <Heart className="w-4 h-4 fill-rose text-rose" />
    </div>
  )
}
