import { useState, useRef } from 'react'
import axios from 'axios'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, FileImage, FileAudio, FileVideo, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileUploadProps {
  onFileProcessed: (data: any) => void
  onError: (error: string) => void
  onProcessing: (filename?: string, type?: 'image' | 'audio' | 'video' | 'text') => void
  targetLanguages: string[]
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const FileUpload: React.FC<FileUploadProps> = ({
  onFileProcessed,
  onError,
  onProcessing,
  targetLanguages,
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [enableDiarization, setEnableDiarization] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    if (!file) return

    
    const fileName = file.name.toLowerCase()
    const validExtensions = ['.jpg', '.jpeg', '.png', '.mp3', '.wav', '.mp4', '.webm', '.m4a', '.avi']
    const fileExtension = fileName.includes('.') ? fileName.substring(fileName.lastIndexOf('.')) : ''
    
    console.log('Проверка файла:', {
      name: file.name,
      type: file.type,
      extension: fileExtension,
      size: file.size
    })
    
    if (!fileExtension || !validExtensions.includes(fileExtension)) {
      onError(`Неподдерживаемый формат файла: ${fileExtension || 'неизвестный'}. Используйте изображения (JPG, PNG), аудио (MP3, WAV) или видео (MP4, WEBM)`)
      return
    }

    
    if (file.size > 100 * 1024 * 1024) {
      onError('Файл слишком большой. Максимальный размер: 100MB')
      return
    }

    
    let fileType: 'image' | 'audio' | 'video' | 'text' = 'text'
    if (['.jpg', '.jpeg', '.png'].includes(fileExtension)) {
      fileType = 'image'
    } else if (['.mp3', '.wav', '.m4a'].includes(fileExtension)) {
      fileType = 'audio'
    } else if (['.mp4', '.webm', '.avi'].includes(fileExtension)) {
      fileType = 'video'
    }

    onProcessing(file.name, fileType)
    setIsUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const languagesToUse = targetLanguages.length > 0 ? targetLanguages.join(',') : 'ru'
      formData.append('target_languages', languagesToUse)
      formData.append('generate_tts', 'false')
      formData.append('replace_text_on_image', 'false')
      
      
      if (fileType === 'audio' || fileType === 'video') {
        formData.append('enable_diarization', enableDiarization ? 'true' : 'false')
      }

      const endpoint = `${API_URL}/api/process/quick`
      
      const response = await axios.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 600000,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            setUploadProgress(percentCompleted)
          }
        },
      })

      setIsUploading(false)
      onFileProcessed(response.data)
    } catch (err: any) {
      console.error('Ошибка обработки файла:', err)
      setIsUploading(false)
      
      let errorMessage = 'Произошла ошибка при обработке файла'
      
      if (err.response) {
        const status = err.response.status
        const detail = err.response.data?.detail || err.response.data?.message || ''
        
        if (status === 503 && detail.includes('не установлена')) {
          errorMessage = `⚠️ AI-модель не установлена.\n\n${detail}\n\nУстановите необходимые зависимости для обработки файлов.`
        } else if (status === 400) {
          errorMessage = `❌ Ошибка валидации: ${detail}`
        } else if (status === 500) {
          errorMessage = `❌ Ошибка сервера: ${detail}`
        } else {
          errorMessage = detail || `Ошибка ${status}: ${err.message}`
        }
      } else if (err.request) {
        errorMessage = '❌ Сервер не отвечает. Убедитесь, что backend запущен на http://localhost:8000'
      } else {
        errorMessage = `❌ Ошибка: ${err.message}`
      }
      
      onError(errorMessage)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFile(file)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFile(file)
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const getFileIcon = () => {
    return <Upload className="h-12 w-12 text-primary" />
  }

  return (
    <Card className="border-2 border-dashed transition-all duration-300 hover:border-primary/50 hover:shadow-lg">
      <CardContent className="p-8">
        <div
          className={cn(
            "relative flex flex-col items-center justify-center space-y-6 rounded-lg transition-all duration-300",
            isDragging && "scale-[1.02] bg-primary/5",
            isUploading && "opacity-75"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,audio/*,video/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading}
          />
          
          {isUploading ? (
            <>
              <Loader2 className="h-16 w-16 text-primary animate-spin" />
              <div className="w-full max-w-xs space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Загрузка...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className={cn(
                "rounded-full p-6 bg-primary/10 transition-all duration-300",
                isDragging && "bg-primary/20 scale-110"
              )}>
                {getFileIcon()}
              </div>
              
              <div className="text-center space-y-2">
                <h3 className="text-xl font-semibold">
                  {isDragging ? 'Отпустите файл здесь' : 'Перетащите файл сюда'}
                </h3>
                <p className="text-muted-foreground">
                  или нажмите для выбора файла
                </p>
              </div>

              <div className="flex flex-wrap gap-3 justify-center">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 text-sm">
                  <FileImage className="h-4 w-4" />
                  <span>JPG, PNG</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 text-sm">
                  <FileAudio className="h-4 w-4" />
                  <span>MP3, WAV</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 text-sm">
                  <FileVideo className="h-4 w-4" />
                  <span>MP4, WEBM</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="mt-2"
                disabled={isUploading}
              >
                Выбрать файл
              </Button>
              
              {/* Чекбокс для распознавания спикеров */}
              <div className="mt-4 flex items-center justify-center space-x-2">
                <input
                  type="checkbox"
                  id="enableDiarization"
                  checked={enableDiarization}
                  onChange={(e) => setEnableDiarization(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary"
                  disabled={isUploading}
                />
                <label
                  htmlFor="enableDiarization"
                  className="text-sm text-muted-foreground cursor-pointer select-none"
                >
                  👥 Распознавать спикеров (кто что говорит)
                </label>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default FileUpload
