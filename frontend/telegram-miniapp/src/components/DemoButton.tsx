import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Play, Sparkles } from 'lucide-react'

interface DemoButtonProps {
  onDemo: () => void
}

const DemoButton: React.FC<DemoButtonProps> = ({ onDemo }) => {
  return (
    <Card className="border-0 shadow-xl bg-amber-50 dark:bg-amber-950 overflow-hidden">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400 animate-pulse" />
          <CardTitle className="text-xl">Попробуйте демо</CardTitle>
        </div>
        <CardDescription>
          Посмотрите работу системы без загрузки файла
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={onDemo}
          className="w-full bg-amber-600 hover:bg-amber-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
          size="lg"
        >
          <Play className="mr-2 h-5 w-5" />
          Запустить демо
        </Button>
        <p className="text-xs text-center text-slate-600 dark:text-slate-400 mt-3">
          🎯 Мгновенный пример для жюри
        </p>
      </CardContent>
    </Card>
  )
}

export default DemoButton

