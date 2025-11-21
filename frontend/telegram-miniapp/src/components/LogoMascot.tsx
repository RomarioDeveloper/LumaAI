import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LogoMascotProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showName?: boolean
  animated?: boolean
}

const sizes = {
  sm: { icon: 'h-6 w-6', text: 'text-xl', name: 'text-sm' },
  md: { icon: 'h-8 w-8', text: 'text-2xl', name: 'text-base' },
  lg: { icon: 'h-10 w-10 md:h-12 md:w-12', text: 'text-4xl md:text-5xl', name: 'text-xl md:text-2xl' },
  xl: { icon: 'h-16 w-16', text: 'text-6xl', name: 'text-3xl' },
}

const LogoMascot: React.FC<LogoMascotProps> = ({ 
  size = 'lg', 
  showName = true,
  animated = true 
}) => {
  return (
    <div className="flex items-center justify-center gap-3">
      
      <div className="relative">
        <Sparkles 
          className={cn(
            sizes[size].icon,
            'text-blue-600 dark:text-blue-400',
            animated && 'animate-pulse'
          )} 
        />
        {animated && (
          <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl"></div>
        )}
      </div>

      
      {showName && (
        <div className="flex flex-col items-start">
          <h1 className={cn(
            sizes[size].name,
            'font-bold text-blue-600 dark:text-blue-400 leading-tight'
          )}>
            Lume
          </h1>
          {size === 'lg' || size === 'xl' ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 -mt-1">
              AI Translation Platform
            </p>
          ) : null}
        </div>
      )}
    </div>
  )
}

export default LogoMascot

