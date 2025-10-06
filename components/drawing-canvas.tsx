"use client"

import { useRef, useState, useEffect } from "react"
import { Pencil, Eraser, Undo, Redo, Trash2, X } from "lucide-react"

interface DrawingCanvasProps {
  onSave: (dataUrl: string) => void
  onClose: () => void
}

export function DrawingCanvas({ onSave, onClose }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [color, setColor] = useState("#ef4444")
  const [lineWidth, setLineWidth] = useState(3)
  const [tool, setTool] = useState<"pen" | "eraser">("pen")
  const [history, setHistory] = useState<string[]>([])
  const [historyStep, setHistoryStep] = useState(-1)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    // Set white background
    ctx.fillStyle = "white"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Save initial state
    saveToHistory()
  }, [])

  const saveToHistory = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const dataUrl = canvas.toDataURL()
    const newHistory = history.slice(0, historyStep + 1)
    newHistory.push(dataUrl)
    setHistory(newHistory)
    setHistoryStep(newHistory.length - 1)
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.beginPath()
    ctx.moveTo(x, y)
    setIsDrawing(true)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.lineTo(x, y)
    ctx.strokeStyle = tool === "eraser" ? "white" : color
    ctx.lineWidth = tool === "eraser" ? lineWidth * 3 : lineWidth
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.stroke()
  }

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false)
      saveToHistory()
    }
  }

  const undo = () => {
    if (historyStep > 0) {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      const img = new Image()
      img.src = history[historyStep - 1]
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0)
      }
      setHistoryStep(historyStep - 1)
    }
  }

  const redo = () => {
    if (historyStep < history.length - 1) {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      const img = new Image()
      img.src = history[historyStep + 1]
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0)
      }
      setHistoryStep(historyStep + 1)
    }
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.fillStyle = "white"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    saveToHistory()
  }

  const handleSave = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const dataUrl = canvas.toDataURL("image/png")
    onSave(dataUrl)
  }

  const colors = ["#ef4444", "#3b82f6", "#22c55e", "#eab308", "#a855f7", "#ec4899", "#000000"]

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1a1a1a] rounded-lg w-full max-w-4xl border border-neutral-800">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-800">
          <h3 className="text-xl font-bold text-white">Draw Your Annotation</h3>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-4 p-4 border-b border-neutral-800 flex-wrap">
          {/* Tools */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTool("pen")}
              className={`p-2 rounded transition-colors ${
                tool === "pen" ? "bg-[#fdb913] text-black" : "bg-neutral-800 text-white hover:bg-neutral-700"
              }`}
              title="Pen"
            >
              <Pencil className="w-5 h-5" />
            </button>
            <button
              onClick={() => setTool("eraser")}
              className={`p-2 rounded transition-colors ${
                tool === "eraser" ? "bg-[#fdb913] text-black" : "bg-neutral-800 text-white hover:bg-neutral-700"
              }`}
              title="Eraser"
            >
              <Eraser className="w-5 h-5" />
            </button>
          </div>

          <div className="h-8 w-px bg-neutral-700"></div>

          {/* Colors */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-400">Color:</span>
            {colors.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded border-2 transition-transform hover:scale-110 ${
                  color === c ? "border-white scale-110" : "border-transparent"
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          <div className="h-8 w-px bg-neutral-700"></div>

          {/* Line Width */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-400">Size:</span>
            <input
              type="range"
              min="1"
              max="20"
              value={lineWidth}
              onChange={(e) => setLineWidth(parseInt(e.target.value))}
              className="w-24"
            />
            <span className="text-sm text-white w-8">{lineWidth}px</span>
          </div>

          <div className="h-8 w-px bg-neutral-700"></div>

          {/* History */}
          <div className="flex items-center gap-2">
            <button
              onClick={undo}
              disabled={historyStep <= 0}
              className="p-2 rounded bg-neutral-800 text-white hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Undo"
            >
              <Undo className="w-5 h-5" />
            </button>
            <button
              onClick={redo}
              disabled={historyStep >= history.length - 1}
              className="p-2 rounded bg-neutral-800 text-white hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Redo"
            >
              <Redo className="w-5 h-5" />
            </button>
            <button
              onClick={clearCanvas}
              className="p-2 rounded bg-red-600 text-white hover:bg-red-700 transition-colors"
              title="Clear All"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Canvas */}
        <div className="p-4">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            className="w-full h-96 bg-white rounded border-2 border-neutral-700 cursor-crosshair"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-neutral-800">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-neutral-800 text-white font-semibold rounded hover:bg-neutral-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-[#fdb913] text-black font-bold rounded hover:bg-[#e5a711] transition-colors"
          >
            Save Drawing
          </button>
        </div>
      </div>
    </div>
  )
}

