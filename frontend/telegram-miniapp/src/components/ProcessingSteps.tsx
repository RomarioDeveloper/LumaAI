import { cn } from '@/lib/utils'
import { FileText, Mic, Languages, Volume2, Video, Check, Loader2 } from 'lucide-react'

interface ProcessingStepsProps {
  currentStep?: number
  fileType?: 'image' | 'audio' | 'video' | 'text'
}

const ProcessingSteps: React.FC<ProcessingStepsProps> = ({ currentStep = 0, fileType = 'image' }) => {
  const steps = [
    {
      id: 1,
      icon: FileText,
      title: '🧩 Извлечение текста',
      description: 'OCR обработка',
      active: fileType === 'image',
    },
    {
      id: 2,
      icon: Mic,
      title: '🤖 Распознавание речи',
      description: 'Whisper V3',
      active: fileType === 'audio' || fileType === 'video',
    },
    {
      id: 3,
      icon: Languages,
      title: '🌍 Перевод',
      description: 'AI Translation',
      active: true,
    },
    {
      id: 4,
      icon: Volume2,
      title: '🔊 Генерация голоса',
      description: 'TTS синтез',
      active: fileType === 'video',
    },
    {
      id: 5,
      icon: Video,
      title: '🎥 Обработка видео',
      description: 'Финализация',
      active: fileType === 'video',
    },
  ].filter(step => step.active)

  return (
    <div className="w-full">
      
      <div className="hidden md:block">
        <div className="flex items-center justify-between gap-2">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              
              <div className="flex flex-col items-center flex-1">
                <div
                  className={cn(
                    'relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300',
                    currentStep > index
                      ? 'bg-green-500 shadow-lg shadow-green-500/50'
                      : currentStep === index
                      ? 'bg-blue-500 shadow-lg shadow-blue-500/50 animate-pulse'
                      : 'bg-slate-200 dark:bg-slate-700'
                  )}
                >
                  {currentStep > index ? (
                    <Check className="w-6 h-6 text-white" />
                  ) : currentStep === index ? (
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  ) : (
                    <step.icon
                      className={cn(
                        'w-5 h-5',
                        currentStep > index
                          ? 'text-white'
                          : currentStep === index
                          ? 'text-white'
                          : 'text-slate-400 dark:text-slate-500'
                      )}
                    />
                  )}
                </div>
                <div className="mt-2 text-center">
                  <div
                    className={cn(
                      'text-xs font-semibold',
                      currentStep >= index
                        ? 'text-slate-700 dark:text-slate-300'
                        : 'text-slate-400 dark:text-slate-600'
                    )}
                  >
                    {step.title}
                  </div>
                  <div
                    className={cn(
                      'text-xs mt-0.5',
                      currentStep >= index
                        ? 'text-slate-500 dark:text-slate-400'
                        : 'text-slate-400 dark:text-slate-600'
                    )}
                  >
                    {step.description}
                  </div>
                </div>
              </div>

              
              {index < steps.length - 1 && (
                <div className="flex-1 h-1 mx-2 relative bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden" style={{ maxWidth: '100px' }}>
                  <div
                    className="h-full rounded-full transition-all duration-500 bg-green-500"
                    style={{
                      width: currentStep > index ? '100%' : currentStep === index ? '50%' : '0%',
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      
      <div className="md:hidden">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center shrink-0">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300',
                    currentStep > index
                      ? 'bg-green-500 shadow-md'
                      : currentStep === index
                      ? 'bg-blue-500 shadow-md animate-pulse'
                      : 'bg-slate-200 dark:bg-slate-700'
                  )}
                >
                  {currentStep > index ? (
                    <Check className="w-5 h-5 text-white" />
                  ) : currentStep === index ? (
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  ) : (
                    <step.icon className="w-4 h-4 text-slate-400" />
                  )}
                </div>
                <div className="mt-1 text-center max-w-[80px]">
                  <div className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 truncate">
                    {step.title}
                  </div>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className="w-8 h-0.5 mx-1 relative bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 bg-green-500"
                    style={{
                      width: currentStep > index ? '100%' : currentStep === index ? '50%' : '0%',
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ProcessingSteps

