"use client"

import { createContext, useContext, useState, useCallback, ReactNode } from "react"
import { cn } from "@/lib/utils"

type ToastType = "success" | "error" | "info" | "warning"

interface ToastAction {
  label: string
  onClick: () => void
}

interface Toast {
  id: string
  message: string
  type: ToastType
  action?: ToastAction
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, action?: ToastAction) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: ToastType = "info", action?: ToastAction) => {
    const id = `${Date.now()}-${Math.random()}`
    const newToast: Toast = { id, message, type, action }
    
    setToasts((prev) => [...prev, newToast])

    // 3秒後に自動削除
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }, [])

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Toast Container */}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.type === "error" ? "alert" : "status"}
            aria-live={toast.type === "error" ? "assertive" : "polite"}
            className={cn(
              "pointer-events-auto animate-in slide-in-from-right-full fade-in duration-300",
              "flex items-center gap-3 rounded-lg px-4 py-3 shadow-lg",
              "max-w-sm border",
              toast.type === "success" && "border-green-200 bg-green-50 text-green-900",
              toast.type === "error" && "border-red-200 bg-red-50 text-red-900",
              toast.type === "warning" && "border-yellow-200 bg-yellow-50 text-yellow-900",
              toast.type === "info" && "border-blue-200 bg-blue-50 text-blue-900"
            )}
            onClick={() => removeToast(toast.id)}
          >
            {/* Icon */}
            <div className="flex-shrink-0">
              {toast.type === "success" && (
                <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {toast.type === "error" && (
                <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              {toast.type === "warning" && (
                <svg className="h-5 w-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
              {toast.type === "info" && (
                <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            
            {/* Message */}
            <div className="flex-1 text-sm font-medium">{toast.message}</div>
            
            {/* Action Button */}
            {toast.action && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  toast.action!.onClick()
                  removeToast(toast.id)
                }}
                className="text-sm font-semibold underline underline-offset-2 hover:no-underline"
              >
                {toast.action.label}
              </button>
            )}
            
            {/* Close Button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                removeToast(toast.id)
              }}
              className="flex-shrink-0 text-current opacity-50 hover:opacity-100"
              aria-label="閉じる"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within ToastProvider")
  }
  return context
}


