import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'dark'
  loading?: boolean
  fullWidth?: boolean
}

const variants = {
  primary:
    'bg-rose text-white hover:bg-rose-dark shadow-md shadow-rose/25 active:scale-[0.98]',
  secondary:
    'bg-white text-espresso border border-gray-200 hover:bg-pearl active:scale-[0.98]',
  ghost: 'bg-transparent text-espresso hover:bg-pearl/80',
  dark: 'bg-espresso text-white hover:bg-charcoal active:scale-[0.98]',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      loading = false,
      fullWidth = false,
      disabled,
      className = '',
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`
          inline-flex items-center justify-center gap-2
          min-h-[48px] px-6 py-3 rounded-xl
          text-sm font-semibold transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
          ${variants[variant]}
          ${fullWidth ? 'w-full' : ''}
          ${className}
        `}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {children}
      </button>
    )
  },
)

Button.displayName = 'Button'
