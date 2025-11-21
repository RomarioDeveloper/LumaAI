
interface TelegramWebApp {
  ready: () => void
  expand: () => void
}

interface Window {
  Telegram?: {
    WebApp: TelegramWebApp
  }
}

interface ImportMetaEnv {
  readonly VITE_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void
        expand: () => void
        close: () => void
        MainButton: {
          text: string
          onClick: (callback: () => void) => void
          show: () => void
          hide: () => void
        }
        BackButton: {
          onClick: (callback: () => void) => void
          show: () => void
          hide: () => void
        }
      }
    }
  }
}

