import { toast as sonnerToast } from "sonner"
import { CheckCircle, AlertCircle, Info, Loader2 } from "lucide-react"

export const toast = {
  success: (message: string, description?: string) => {
    sonnerToast.success(message, {
      description,
    })
  },

  error: (message: string, description?: string) => {
    sonnerToast.error(message, {
      description,
    })
  },

  info: (message: string, description?: string) => {
    sonnerToast.info(message, {
      description,
    })
  },

  loading: (message: string, description?: string) => {
    return sonnerToast.loading(message, {
      description,
    })
  },

  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: unknown) => string)
    }
  ) => {
    return sonnerToast.promise(promise, messages)
  },

  dismiss: (id?: string | number) => {
    sonnerToast.dismiss(id)
  },
}