import { forwardRef, type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s/g, '-')

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-espresso/80 mb-2"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full min-h-[48px] px-4 py-3 rounded-xl
            bg-white border text-espresso text-base
            placeholder:text-gray-400
            transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-rose/30 focus:border-rose
            ${error ? 'border-red-400' : 'border-gray-200'}
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-sm text-red-500">{error}</p>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'
