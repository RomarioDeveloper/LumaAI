import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Brain, Gauge, Languages } from 'lucide-react'

const DemoStats: React.FC = () => {
  return (
    <Card className="border-0 shadow-xl bg-white dark:bg-slate-900 overflow-hidden">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-pulse" />
          <CardTitle className="text-xl">AI Мощность</CardTitle>
        </div>
        <CardDescription>
          Технологии, которые мы используем
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        
        <div className="p-4 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-blue-200 dark:border-blue-800">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 flex-1">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950">
                <Brain className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-sm text-slate-700 dark:text-slate-300">
                  🎧 Whisper V3 Large
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-500">
                  Распознавание речи
                </div>
              </div>
            </div>
            <Badge className="bg-green-500 text-white shrink-0">
              98% точность
            </Badge>
          </div>
        </div>

        
        <div className="p-4 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-purple-200 dark:border-purple-800">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 flex-1">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-950">
                <Gauge className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-sm text-slate-700 dark:text-slate-300">
                  📸 EasyOCR + PaddleOCR
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-500">
                  Извлечение текста
                </div>
              </div>
            </div>
            <Badge className="bg-green-500 text-white shrink-0">
              95% точность
            </Badge>
          </div>
        </div>

        
        <div className="p-4 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-pink-200 dark:border-pink-800">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 flex-1">
              <div className="p-2 rounded-lg bg-pink-100 dark:bg-pink-950">
                <Languages className="h-4 w-4 text-pink-600 dark:text-pink-400" />
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-sm text-slate-700 dark:text-slate-300">
                  🌍 Neural Translation
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-500">
                  11 языков поддержки
                </div>
              </div>
            </div>
            <Badge className="bg-blue-500 text-white shrink-0">
              Мгновенно
            </Badge>
          </div>
        </div>

        
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="text-center p-3 rounded-lg bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200 dark:border-slate-800">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              10-20с
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Скорость обработки
            </div>
          </div>
          <div className="text-center p-3 rounded-lg bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200 dark:border-slate-800">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              99.9%
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Успешных запросов
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default DemoStats

