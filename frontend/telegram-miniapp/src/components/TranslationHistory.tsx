import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, FileImage, FileAudio, FileVideo, FileText, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface HistoryItem {
  id: string
  filename: string
  fileType: 'image' | 'audio' | 'video' | 'text'
  timestamp: number
  duration?: string
  sourceLanguage: string
  targetLanguages: string[]
  wordCount?: number
}

const STORAGE_KEY = 'ai-translate-history'
const MAX_HISTORY_ITEMS = 10

const languageFlags: { [key: string]: string } = {
  ru: '🇷🇺',
  kk: '🇰🇿',
  en: '🇬🇧',
  de: '🇩🇪',
  fr: '🇫🇷',
  es: '🇪🇸',
  zh: '🇨🇳',
  it: '🇮🇹',
  pt: '🇵🇹',
  ar: '🇸🇦',
  tr: '🇹🇷',
}

const fileTypeIcons = {
  image: FileImage,
  audio: FileAudio,
  video: FileVideo,
  text: FileText,
}

const fileTypeColors = {
  image: 'text-blue-600 bg-blue-50 dark:bg-blue-950',
  audio: 'text-purple-600 bg-purple-50 dark:bg-purple-950',
  video: 'text-pink-600 bg-pink-50 dark:bg-pink-950',
  text: 'text-green-600 bg-green-50 dark:bg-green-950',
}

export const addToHistory = (item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
  try {
    const history = getHistory()
    const newItem: HistoryItem = {
      ...item,
      id: Date.now().toString(),
      timestamp: Date.now(),
    }
    
    const updatedHistory = [newItem, ...history].slice(0, MAX_HISTORY_ITEMS)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory))
    
    
    window.dispatchEvent(new CustomEvent('historyUpdate'))
  } catch (error) {
    console.error('Error saving to history:', error)
  }
}

export const getHistory = (): HistoryItem[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Error loading history:', error)
    return []
  }
}

export const clearHistory = () => {
  localStorage.removeItem(STORAGE_KEY)
  window.dispatchEvent(new CustomEvent('historyUpdate'))
}

const TranslationHistory: React.FC = () => {
  const [history, setHistory] = useState<HistoryItem[]>([])

  useEffect(() => {
    setHistory(getHistory())

    const handleUpdate = () => {
      setHistory(getHistory())
    }

    window.addEventListener('historyUpdate', handleUpdate)
    return () => window.removeEventListener('historyUpdate', handleUpdate)
  }, [])

  const formatTimeAgo = (timestamp: number): string => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000)
    
    if (seconds < 60) return 'только что'
    if (seconds < 3600) return `${Math.floor(seconds / 60)} мин назад`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} ч назад`
    return `${Math.floor(seconds / 86400)} дн назад`
  }

  const removeItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const updatedHistory = history.filter(item => item.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory))
    setHistory(updatedHistory)
  }

  if (history.length === 0) {
    return null
  }

  return (
    <Card className="border-0 shadow-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              История переводов
            </CardTitle>
            <CardDescription>
              Последние обработки файлов
            </CardDescription>
          </div>
          {history.length > 0 && (
            <button
              onClick={() => {
                if (confirm('Очистить всю историю?')) {
                  clearHistory()
                }
              }}
              className="text-xs text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 transition-colors"
            >
              Очистить
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {history.slice(0, 5).map((item) => {
            const Icon = fileTypeIcons[item.fileType]
            return (
              <div
                key={item.id}
                className="group relative flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all duration-200 border border-slate-200 dark:border-slate-800"
              >
                
                <div className={cn('p-2 rounded-lg shrink-0', fileTypeColors[item.fileType])}>
                  <Icon className="h-4 w-4" />
                </div>

                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                      {item.filename}
                    </span>
                    {item.duration && (
                      <Badge variant="outline" className="text-xs shrink-0">
                        {item.duration}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-500 dark:text-slate-500">
                      {languageFlags[item.sourceLanguage] || '🌐'} →{' '}
                      {item.targetLanguages.map(lang => languageFlags[lang] || '🌐').join(' ')}
                    </span>
                    {item.wordCount && (
                      <>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs text-slate-500 dark:text-slate-500">
                          {item.wordCount} слов
                        </span>
                      </>
                    )}
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-500 dark:text-slate-500">
                      {formatTimeAgo(item.timestamp)}
                    </span>
                  </div>
                </div>

                
                <button
                  onClick={(e) => removeItem(item.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-red-100 dark:hover:bg-red-950 transition-all"
                >
                  <X className="h-4 w-4 text-slate-400 hover:text-red-600 dark:hover:text-red-400" />
                </button>
              </div>
            )
          })}
        </div>
        
        {history.length > 5 && (
          <p className="text-xs text-center text-slate-500 dark:text-slate-500 mt-3">
            Показано 5 из {history.length} записей
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export default TranslationHistory

