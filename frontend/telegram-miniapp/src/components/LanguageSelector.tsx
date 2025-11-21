import { Badge } from '@/components/ui/badge'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LanguageSelectorProps {
  selectedLanguages: string[]
  onLanguagesChange: (languages: string[]) => void
}

const languages = [
  { code: 'ru', name: 'Русский', flag: '🇷🇺', nativeName: 'Русский' },
  { code: 'kk', name: 'Қазақша', flag: '🇰🇿', nativeName: 'Қазақша' },
  { code: 'en', name: 'English', flag: '🇬🇧', nativeName: 'English' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪', nativeName: 'Deutsch' },
  { code: 'fr', name: 'Français', flag: '🇫🇷', nativeName: 'Français' },
  { code: 'es', name: 'Español', flag: '🇪🇸', nativeName: 'Español' },
  { code: 'zh', name: '中文', flag: '🇨🇳', nativeName: '中文' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹', nativeName: 'Italiano' },
  { code: 'pt', name: 'Português', flag: '🇵🇹', nativeName: 'Português' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦', nativeName: 'العربية' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷', nativeName: 'Türkçe' },
]

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  selectedLanguages,
  onLanguagesChange,
}) => {
  const handleToggle = (code: string) => {
    if (selectedLanguages.includes(code)) {
      if (selectedLanguages.length > 1) {
        onLanguagesChange(selectedLanguages.filter(lang => lang !== code))
      }
    } else {
      onLanguagesChange([...selectedLanguages, code])
    }
  }

  return (
    <div className="space-y-4">
      
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">
          Доступно {languages.length} языков
        </h3>
        <Badge 
          variant="secondary" 
          className="bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
        >
          Выбрано: {selectedLanguages.length}
        </Badge>
      </div>

      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {languages.map(lang => {
          const isSelected = selectedLanguages.includes(lang.code)
          const isLastSelected = isSelected && selectedLanguages.length === 1
          
          return (
            <button
              key={lang.code}
              onClick={() => handleToggle(lang.code)}
              disabled={isLastSelected}
              className={cn(
                "group relative flex items-center gap-3 p-3 md:p-4 rounded-xl transition-all duration-200",
                "border-2 hover:scale-[1.02] active:scale-[0.98]",
                isSelected
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950 shadow-md"
                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm",
                isLastSelected && "opacity-60 cursor-not-allowed"
              )}
            >
              
              <span className="text-2xl md:text-3xl transition-transform duration-200 group-hover:scale-110 shrink-0">
                {lang.flag}
              </span>
              
              
              <div className="flex-1 text-left min-w-0">
                <div className={cn(
                  "font-semibold text-sm md:text-base truncate",
                  isSelected 
                    ? "text-blue-700 dark:text-blue-300" 
                    : "text-slate-700 dark:text-slate-300"
                )}>
                  {lang.nativeName}
                </div>
              </div>

              
              {isSelected && (
                <div className="absolute -top-1 -right-1 md:top-1 md:right-1">
                  <div className="h-5 w-5 md:h-6 md:w-6 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center shadow-lg animate-in zoom-in duration-200">
                    <Check className="h-3 w-3 md:h-4 md:w-4 text-white" />
                  </div>
                </div>
              )}
            </button>
          )
        })}
      </div>

      
      <p className="text-xs text-center text-slate-500 dark:text-slate-500 pt-2">
        Выберите минимум 1 язык для перевода. Вы можете выбрать несколько языков одновременно
      </p>
    </div>
  )
}

export default LanguageSelector
