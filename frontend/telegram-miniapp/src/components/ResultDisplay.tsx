import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Copy, Check, RotateCcw, FileText, Volume2, Download, Eye, EyeOff, Square } from 'lucide-react'

interface ResultDisplayProps {
  result: any
  onReset: () => void
}

const languageNames: { [key: string]: string } = {
  ru: 'Русский 🇷🇺',
  kk: 'Қазақша 🇰🇿',
  en: 'English 🇬🇧',
  de: 'Deutsch 🇩🇪',
  fr: 'Français 🇫🇷',
  es: 'Español 🇪🇸',
  zh: '中文 🇨🇳',
  it: 'Italiano 🇮🇹',
  pt: 'Português 🇵🇹',
  ar: 'العربية 🇸🇦',
  tr: 'Türkçe 🇹🇷',
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ result, onReset }) => {
  const [activeTab, setActiveTab] = useState<string>('original')
  const [copied, setCopied] = useState<string | null>(null)
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(false)
  const [ttsLoading, setTtsLoading] = useState<string | null>(null)
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState<string | null>(null)
  const [selectedVoice, setSelectedVoice] = useState<'default' | 'slow'>('default')

  const copyToClipboard = async (text: string, lang: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(lang)
      setTimeout(() => setCopied(null), 2000)
    } catch (err) {
      console.error('Ошибка копирования:', err)
    }
  }

  const getTextToDisplay = () => {
    if (activeTab === 'original') {
      return result.recognition?.text || ''
    }
    return result.translation?.translations?.[activeTab] || ''
  }

  // Проверка наличия информации о спикерах
  const hasSpeakers = result.recognition?.speakers && result.recognition?.speakers.num_speakers > 0

  const downloadText = (text: string, filename: string) => {
    const element = document.createElement('a')
    const file = new Blob([text], { type: 'text/plain' })
    element.href = URL.createObjectURL(file)
    element.download = filename
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const handleTTS = async (text: string, language: string) => {
    
    if (isPlaying === language && currentAudio) {
      currentAudio.pause()
      currentAudio.currentTime = 0
      setCurrentAudio(null)
      setIsPlaying(null)
      return
    }

    
    if (currentAudio) {
      currentAudio.pause()
      currentAudio.currentTime = 0
    }

    setTtsLoading(language)
    try {
      const response = await fetch('http://localhost:8000/api/tts/synthesize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text.substring(0, 500), 
          language: language,
          voice: selectedVoice, 
        }),
      })

      if (!response.ok) {
        throw new Error('Ошибка генерации аудио')
      }

      const data = await response.json()
      
      
      const audio = new Audio(`http://localhost:8000${data.audio_url}`)
      
      audio.onended = () => {
        setIsPlaying(null)
        setCurrentAudio(null)
      }
      
      audio.onerror = () => {
        setIsPlaying(null)
        setCurrentAudio(null)
        alert('Ошибка воспроизведения аудио')
      }
      
      await audio.play()
      setCurrentAudio(audio)
      setIsPlaying(language)
    } catch (error) {
      console.error('TTS error:', error)
      alert('Ошибка генерации голоса. Попробуйте позже.')
    } finally {
      setTtsLoading(null)
    }
  }

  const translations = result.translation?.translations || {}
  const sourceLanguage = result.translation?.source_language || 'auto'
  const boundingBoxes = result.recognition?.bounding_boxes || []
  const hasBoundingBoxes = boundingBoxes.length > 0

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <Card className="border-0 shadow-xl bg-green-50 dark:bg-green-950">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
                <Check className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-green-700 dark:text-green-300">
                  Обработка завершена!
                </h3>
                <p className="text-sm text-green-600 dark:text-green-400">
                  Текст успешно распознан и переведен
                </p>
              </div>
            </div>
            <Button
              onClick={onReset}
              variant="outline"
              className="border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Новый файл
            </Button>
          </div>
        </CardContent>
      </Card>

      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {Object.keys(translations).length + 1}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Языков
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {getTextToDisplay().length}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Символов
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {getTextToDisplay().split(/\s+/).filter(Boolean).length}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Слов
              </div>
            </div>
          </CardContent>
        </Card>

        {hasSpeakers && (
          <Card className="border-0 shadow-lg bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-pink-600 dark:text-pink-400">
                  {result.recognition.speakers.num_speakers}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  👥 Спикеров
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {hasBoundingBoxes && (
          <Card className="border-0 shadow-lg bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                  {boundingBoxes.length}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Блоков
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      
      <Card className="border-0 shadow-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm overflow-hidden">
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            
            <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3">
              <TabsList className="w-full grid grid-cols-2 md:flex md:flex-wrap md:h-auto md:w-auto gap-2 bg-transparent">
                <TabsTrigger
                  value="original"
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Оригинал
                </TabsTrigger>
                {Object.keys(translations).map(lang => (
                  <TabsTrigger
                    key={lang}
                    value={lang}
                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                  >
                    {languageNames[lang] || lang.toUpperCase()}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            
            <TabsContent value="original" className="p-6 m-0">
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-sm">
                      {languageNames[sourceLanguage] || sourceLanguage.toUpperCase()}
                    </Badge>
                    {hasBoundingBoxes && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowBoundingBoxes(!showBoundingBoxes)}
                        className="ml-2"
                      >
                        {showBoundingBoxes ? (
                          <>
                            <EyeOff className="mr-2 h-4 w-4" />
                            Скрыть блоки
                          </>
                        ) : (
                          <>
                            <Eye className="mr-2 h-4 w-4" />
                            Показать блоки
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(getTextToDisplay(), 'original')}
                    >
                      {copied === 'original' ? (
                        <Check className="h-4 w-4 mr-2" />
                      ) : (
                        <Copy className="h-4 w-4 mr-2" />
                      )}
                      {copied === 'original' ? 'Скопировано!' : 'Копировать'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadText(getTextToDisplay(), 'original.txt')}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Скачать
                    </Button>
                  </div>
                </div>

                
                {showBoundingBoxes && hasBoundingBoxes && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h4 className="font-semibold text-blue-700 dark:text-blue-300 mb-3">
                      Найденные блоки текста ({boundingBoxes.length}):
                    </h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {boundingBoxes.slice(0, 20).map((box: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-3 bg-white dark:bg-slate-900 rounded border border-blue-100 dark:border-blue-900 text-sm"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <span className="font-mono text-slate-700 dark:text-slate-300">
                                {box.text}
                              </span>
                            </div>
                            <Badge variant="outline" className="text-xs shrink-0">
                              {(box.confidence * 100).toFixed(0)}%
                            </Badge>
                          </div>
                        </div>
                      ))}
                      {boundingBoxes.length > 20 && (
                        <p className="text-xs text-slate-500 text-center">
                          Показано 20 из {boundingBoxes.length} блоков
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Информация о спикерах */}
                {hasSpeakers && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                      <span className="text-2xl">👥</span>
                      <span>Обнаружено спикеров: {result.recognition.speakers.num_speakers}</span>
                    </div>
                    
                    <div className="space-y-2">
                      {result.recognition.segments?.filter((seg: any) => seg.speaker).map((segment: any, idx: number) => (
                        <div 
                          key={idx}
                          className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700"
                        >
                          <div className="flex items-start gap-3">
                            <Badge 
                              variant="secondary" 
                              className="text-xs font-mono bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300 shrink-0"
                            >
                              {segment.speaker}
                            </Badge>
                            <div className="flex-1">
                              <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                                {segment.start?.toFixed(1)}s - {segment.end?.toFixed(1)}s
                              </div>
                              <p className="text-sm text-slate-700 dark:text-slate-300">
                                {segment.text}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-6 bg-slate-50 dark:bg-slate-950 rounded-lg min-h-[200px]">
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {getTextToDisplay()}
                  </p>
                </div>
              </div>
            </TabsContent>

            
            {Object.entries(translations).map(([lang, text]) => (
              <TabsContent key={lang} value={lang} className="p-6 m-0">
                <div className="space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="text-sm">
                        {languageNames[lang] || lang.toUpperCase()}
                      </Badge>
                      
                      <div className="flex gap-1">
                        <button
                          onClick={() => setSelectedVoice('default')}
                          className={'px-3 py-1 text-xs rounded-full transition-all ' + (
                            selectedVoice === 'default'
                              ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                          )}
                          title="Обычная скорость озвучки"
                        >
                          🎯 Обычный
                        </button>
                        <button
                          onClick={() => setSelectedVoice('slow')}
                          className={'px-3 py-1 text-xs rounded-full transition-all ' + (
                            selectedVoice === 'slow'
                              ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                          )}
                          title="Медленная озвучка для обучения"
                        >
                          🐢 Медленный
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(text as string, lang)}
                      >
                        {copied === lang ? (
                          <Check className="h-4 w-4 mr-2" />
                        ) : (
                          <Copy className="h-4 w-4 mr-2" />
                        )}
                        {copied === lang ? 'Скопировано!' : 'Копировать'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadText(text as string, `translation_${lang}.txt`)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Скачать
                      </Button>
                      
                      <Button
                        size="sm"
                        variant={isPlaying === lang ? "default" : "outline"}
                        onClick={() => handleTTS(text as string, lang)}
                        disabled={ttsLoading === lang}
                        className={isPlaying === lang ? "bg-blue-600 hover:bg-blue-700" : ""}
                        title="Google TTS - высокое качество озвучки"
                      >
                        {ttsLoading === lang ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 dark:border-white mr-2"></div>
                            Генерация...
                          </>
                        ) : isPlaying === lang ? (
                          <>
                            <Square className="h-4 w-4 mr-2 fill-current" />
                            Остановить
                          </>
                        ) : (
                          <>
                            <Volume2 className="h-4 w-4 mr-2" />
                            Озвучить
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="p-6 bg-slate-50 dark:bg-slate-950 rounded-lg min-h-[200px]">
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {text as string}
                    </p>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

export default ResultDisplay
