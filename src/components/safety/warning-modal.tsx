"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

interface WarningModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  message: string
  severity: 'warning' | 'error'
}

export function WarningModal({ isOpen, onClose, title, message, severity }: WarningModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className={`h-5 w-5 ${severity === 'error' ? 'text-red-500' : 'text-yellow-500'}`} />
            {title}
          </DialogTitle>
          <DialogDescription className="text-left">
            {message}
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end">
          <Button onClick={onClose}>
            I Understand
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}