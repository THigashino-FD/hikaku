import { useEffect, useRef, useState } from "react"

interface UseRevealAnimationProps {
  animationType: 'none' | 'demo'
  initialSliderPosition: number
  beforeImageLoaded: boolean
  afterImageLoaded: boolean
  onPositionChange: (position: number) => void
}

interface UseRevealAnimationReturn {
  animationCancelled: boolean
  isAnimating: boolean
  cancelAnimation: () => void
}

export function useRevealAnimation({
  animationType,
  initialSliderPosition,
  beforeImageLoaded,
  afterImageLoaded,
  onPositionChange,
}: UseRevealAnimationProps): UseRevealAnimationReturn {
  const [animationCancelled, setAnimationCancelled] = useState(false)
  const animationFrameRef = useRef<number | null>(null)
  const isAnimatingRef = useRef(false)

  // アニメーションをキャンセルする関数
  const cancelAnimation = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    isAnimatingRef.current = false
    setAnimationCancelled(true)
  }

  // 初期表示アニメーション（自動リベール）
  // 目的: 「スライダーを動かすと Before/After を理解できる」ことを、1回のデモで伝える
  // 方針: 初期位置→(After側を見せる)→初期位置→(Before側を見せる)→初期位置（途中で少し止める）
  useEffect(() => {
    // animationTypeが'demo'以外の場合はアニメーションを実行しない
    if (animationType !== 'demo') {
      return
    }

    // 既にキャンセルされているか、既に実行中の場合は何もしない
    if (animationCancelled || isAnimatingRef.current) {
      return
    }

    // OS設定で「視差効果を減らす」を尊重
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches
    if (prefersReducedMotion) {
      return
    }

    let startTime: number | null = null

    // 初期位置を基準に、左右に30%ずつ動く（より大きく）
    const basePos = initialSliderPosition
    const rightPos = Math.min(basePos + 30, 100)
    const leftPos = Math.max(basePos - 30, 0)

    // タイムライン（ms）: "止まる"を挟んで、Before/Afterが切り替わることを認知しやすくする（よりゆっくり）
    const keyframes: Array<{ t: number; pos: number }> = [
      { t: 0, pos: basePos },
      { t: 400, pos: basePos },
      { t: 1800, pos: rightPos },
      { t: 2200, pos: rightPos },
      { t: 3600, pos: leftPos },
      { t: 4000, pos: leftPos },
      { t: 6000, pos: basePos },
    ]
    const totalDuration = keyframes[keyframes.length - 1]!.t

    const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2

    const positionAt = (elapsed: number) => {
      if (elapsed <= 0) return keyframes[0]!.pos
      if (elapsed >= totalDuration) return keyframes[keyframes.length - 1]!.pos

      for (let i = 0; i < keyframes.length - 1; i++) {
        const a = keyframes[i]!
        const b = keyframes[i + 1]!
        if (elapsed >= a.t && elapsed <= b.t) {
          if (a.pos === b.pos || b.t === a.t) return a.pos
          const raw = (elapsed - a.t) / (b.t - a.t)
          const eased = easeInOutSine(raw)
          return a.pos + (b.pos - a.pos) * eased
        }
      }
      return basePos
    }

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const elapsed = timestamp - startTime
      const pos = positionAt(elapsed)
      onPositionChange(pos)

      if (elapsed < totalDuration && isAnimatingRef.current) {
        animationFrameRef.current = requestAnimationFrame(animate)
      } else {
        onPositionChange(basePos)
        isAnimatingRef.current = false
      }
    }

    // 画像が両方読み込まれてからアニメーション開始
    if (beforeImageLoaded && afterImageLoaded) {
      isAnimatingRef.current = true
      animationFrameRef.current = requestAnimationFrame(animate)
    }

    return () => {
      // ここでのクリーンアップは「本当にアンマウントされた時」または「画像URLが変わった時」に限定される
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [beforeImageLoaded, afterImageLoaded, animationType, animationCancelled, initialSliderPosition, onPositionChange])

  return {
    animationCancelled,
    isAnimating: isAnimatingRef.current,
    cancelAnimation,
  }
}

