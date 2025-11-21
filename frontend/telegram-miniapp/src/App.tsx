import { useState, useEffect } from 'react'
import FileUpload from './components/FileUpload'
import LanguageSelector from './components/LanguageSelector'
import ResultDisplay from './components/ResultDisplay'
import ProcessingSteps from './components/ProcessingSteps'
import TranslationHistory, { addToHistory } from './components/TranslationHistory'
import DemoStats from './components/DemoStats'
import DemoButton from './components/DemoButton'
import LogoMascot from './components/LogoMascot'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card'
import { Button } from './components/ui/button'
import { Loader2, Languages, FileImage, FileAudio, Zap, Globe } from 'lucide-react'

function App() {
  const [step, setStep] = useState<'upload' | 'processing' | 'result'>('upload')
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['ru', 'kk', 'en'])
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [processingStartTime, setProcessingStartTime] = useState<number | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0)
  const [processingStep, setProcessingStep] = useState<number>(0)
  const [fileType, setFileType] = useState<'image' | 'audio' | 'video' | 'text'>('image')
  const [uploadedFilename, setUploadedFilename] = useState<string>('')

  useEffect(() => {
    
    try {
      const tg = (window as any).Telegram?.WebApp
      if (tg) {
        tg.ready()
        tg.expand()
      }
    } catch (e) {
      console.log('Telegram WebApp не доступен (локальный режим)')
    }
  }, [])

  
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (step === 'processing' && processingStartTime) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - processingStartTime) / 1000)
        setElapsedSeconds(elapsed)
      }, 1000)
    } else {
      setElapsedSeconds(0)
    }
    
    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [step, processingStartTime])

  const handleFileProcessed = (data: any) => {
    setResult(data)
    setStep('result')
    setError(null)
    setProcessingStartTime(null)
    setElapsedSeconds(0)
    setProcessingStep(0)

    
    const text = data.recognition?.text || ''
    const wordCount = text.split(/\s+/).filter(Boolean).length
    
    addToHistory({
      filename: uploadedFilename || 'unknown',
      fileType: fileType,
      sourceLanguage: data.translation?.source_language || 'auto',
      targetLanguages: selectedLanguages,
      wordCount: wordCount,
      duration: formatTime(elapsedSeconds),
    })
  }

  const handleError = (errorMessage: string) => {
    setError(errorMessage)
    setStep('upload')
    setProcessingStartTime(null)
    setElapsedSeconds(0)
  }

  const handleProcessing = (filename?: string, type?: 'image' | 'audio' | 'video' | 'text') => {
    setStep('processing')
    setError(null)
    setProcessingStartTime(Date.now())
    setElapsedSeconds(0)
    setProcessingStep(0)
    if (filename) setUploadedFilename(filename)
    if (type) setFileType(type)

    
    const steps = type === 'video' ? 5 : type === 'audio' ? 3 : 2
    const stepDuration = 2000 

    for (let i = 1; i <= steps; i++) {
      setTimeout(() => {
        setProcessingStep(i)
      }, i * stepDuration)
    }
  }

  const handleReset = () => {
    setStep('upload')
    setResult(null)
    setError(null)
    setProcessingStartTime(null)
    setElapsedSeconds(0)
    setProcessingStep(0)
    setUploadedFilename('')
  }

  const handleDemo = () => {
    
    const demoResult = {
      recognition: {
        text: 'Привет! Это демонстрационный пример работы системы AI-Translate. Мы используем передовые AI-модели для распознавания текста и речи, а также для перевода на множество языков.',
        bounding_boxes: [],
      },
      translation: {
        source_language: 'ru',
        translations: {
          kk: 'Сәлем! Бұл AI-Translate жүйесінің жұмысының демонстрациялық мысалы. Біз мәтін мен сөйлеуді тану, сондай-ақ көптеген тілдерге аударма жасау үшін озық AI модельдерін қолданамыз.',
          en: 'Hello! This is a demonstration example of the AI-Translate system. We use advanced AI models for text and speech recognition, as well as translation into many languages.',
        },
      },
    }

    setUploadedFilename('demo_example.png')
    setFileType('image')
    handleProcessing('demo_example.png', 'image')

    
    setTimeout(() => {
      setResult(demoResult)
      setStep('result')
      setProcessingStep(0)
      
      const text = demoResult.recognition.text
      const wordCount = text.split(/\s+/).filter(Boolean).length
      
      addToHistory({
        filename: 'demo_example.png',
        fileType: 'image',
        sourceLanguage: 'ru',
        targetLanguages: ['kk', 'en'],
        wordCount: wordCount,
        duration: '6с',
      })
    }, 6000)
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    if (mins > 0) {
      return `${mins}м ${secs}с`
    }
    return `${secs}с`
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 relative">

      <div className="relative container mx-auto px-4 py-6 md:py-12 max-w-7xl">
        
        <div className="text-center mb-8 md:mb-12">
          <div className="mb-4">
            <LogoMascot size="lg" showName={true} animated={true} />
          </div>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Мощный AI-инструмент для распознавания и перевода текста из любых медиа-файлов
          </p>

          
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            <div className="px-4 py-2 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center gap-2 text-sm">
                <FileImage className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-slate-700 dark:text-slate-300">Изображения</span>
              </div>
            </div>
            <div className="px-4 py-2 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center gap-2 text-sm">
                <FileAudio className="h-4 w-4 text-purple-600" />
                <span className="font-medium text-slate-700 dark:text-slate-300">Аудио</span>
              </div>
            </div>
            <div className="px-4 py-2 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center gap-2 text-sm">
                <Globe className="h-4 w-4 text-green-600" />
                <span className="font-medium text-slate-700 dark:text-slate-300">11 языков</span>
              </div>
            </div>
            <div className="px-4 py-2 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center gap-2 text-sm">
                <Zap className="h-4 w-4 text-yellow-600" />
                <span className="font-medium text-slate-700 dark:text-slate-300">10-20 сек</span>
              </div>
            </div>
          </div>
        </div>

        
        <main className="space-y-6">
          {step === 'upload' && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                <div className="lg:col-span-1 space-y-6">
                  <Card className="border-0 shadow-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm">
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Languages className="h-5 w-5 text-blue-600" />
                        <CardTitle className="text-xl">Выбор языков</CardTitle>
                      </div>
                      <CardDescription>
                        Выберите языки для перевода
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <LanguageSelector
                        selectedLanguages={selectedLanguages}
                        onLanguagesChange={setSelectedLanguages}
                      />
                    </CardContent>
                  </Card>

                  
                  <div className="hidden lg:block">
                    <DemoStats />
                  </div>
                </div>

                
                <div className="lg:col-span-2 space-y-6">
                  <Card className="border-0 shadow-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="text-xl">Загрузка файла</CardTitle>
                      <CardDescription>
                        Перетащите файл или нажмите для выбора
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <FileUpload
                        onFileProcessed={handleFileProcessed}
                        onError={handleError}
                        onProcessing={handleProcessing}
                        targetLanguages={selectedLanguages}
                      />
                    </CardContent>
                  </Card>

                  
                  <DemoButton onDemo={handleDemo} />
                </div>
              </div>

              
              <TranslationHistory />

              
              <div className="lg:hidden">
                <DemoStats />
              </div>
            </>
          )}

          {step === 'processing' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              <Card className="border-0 shadow-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm">
                <CardContent className="pt-6 pb-6">
                  <ProcessingSteps currentStep={processingStep} fileType={fileType} />
                </CardContent>
              </Card>

              
              <Card className="border-0 shadow-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm">
                <CardContent className="flex flex-col items-center justify-center py-16 px-6">
                  <div className="relative mb-8">
                    <Loader2 className="h-20 w-20 text-blue-600 animate-spin" />
                    <div className="absolute inset-0 bg-blue-500/30 rounded-full blur-2xl animate-pulse" />
                  </div>
                  
                  <h3 className="text-2xl md:text-3xl font-bold mb-3 text-center text-slate-800 dark:text-slate-200">
                    Обрабатываем ваш файл
                  </h3>
                  
                  <div className="space-y-3 text-center mb-6">
                    <div className="flex items-center justify-center gap-2 text-slate-600 dark:text-slate-400">
                      <div className="h-2 w-2 rounded-full bg-blue-600 animate-pulse"></div>
                      <span>Распознавание текста/речи</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-slate-600 dark:text-slate-400">
                      <div className="h-2 w-2 rounded-full bg-purple-600 animate-pulse delay-100"></div>
                      <span>Перевод на {selectedLanguages.length} {selectedLanguages.length === 1 ? 'язык' : 'языка'}</span>
                    </div>
                  </div>

                  <div className="mt-6 px-6 py-4 bg-blue-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p className="text-lg font-semibold text-center">
                      <span className="text-slate-600 dark:text-slate-400">⏱ </span>
                      <span className="text-blue-600 dark:text-blue-400">{formatTime(elapsedSeconds)}</span>
                    </p>
                  </div>

                  <p className="text-sm text-slate-500 dark:text-slate-500 mt-6 text-center">
                    Обычно занимает 10-20 секунд для изображений, 15-30 секунд для аудио
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {step === 'result' && result && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <ResultDisplay
                result={result}
                onReset={handleReset}
              />
            </div>
          )}

          {error && (
            <Card className="border-red-200 dark:border-red-800 bg-red-50/80 dark:bg-red-950/80 shadow-xl backdrop-blur-sm animate-in fade-in slide-in-from-top-4 duration-300">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="rounded-full bg-red-100 dark:bg-red-900 p-4">
                    <svg
                      className="h-8 w-8 text-red-600 dark:text-red-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-red-600 dark:text-red-400">Произошла ошибка</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-line max-w-md">
                      {error}
                    </p>
                  </div>
                  <Button
                    onClick={handleReset}
                    className="mt-4 bg-blue-600 hover:bg-blue-700"
                  >
                    Попробовать снова
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </main>

        
        <footer className="mt-12 text-center">
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200 dark:border-slate-800 shadow-sm">
            <LogoMascot size="sm" showName={false} animated={false} />
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Lume AI-Translate • Hackathon 2025 TOU
            </span>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default App
