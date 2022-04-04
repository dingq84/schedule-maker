import { useRef, useEffect, useState, useCallback } from 'react'

export interface TimerProps {
	interval?: number
	callback?: () => void
}

function useTimer(props: TimerProps) {
	const { callback, interval = 1000 } = props
	// 目前執行幾次 timeout，用來修正誤差
	const count = useRef<number>(0)
	// 依據偏差，動態調整下次 timeout 時間
	const nextTime = useRef<number>(interval)
	const startTime = useRef(0)
	const timer = useRef<number>()
	const [mode, setMode] = useState<'idle' | 'stop' | 'start'>('idle')

	useEffect(() => {
		return () => {
			clearTimeout(timer.current)
		}
	}, [])

	const start = useCallback((): void => {
		if (mode !== 'start') {
			setMode('start')
		}

		timer.current = window.setTimeout(() => {
			if (startTime.current === 0) {
				startTime.current = new Date().getTime()
			}

			const offset = new Date().getTime() - (startTime.current + count.current * interval)
			nextTime.current = Math.max(interval - offset, 0)
			count.current++

			if (callback) {
				callback()
			}

			start()
		}, nextTime.current)
	}, [callback, interval, mode])

	const stop = useCallback((): void => {
		clearTimeout(timer.current)
		count.current = 0
		startTime.current = 0
		setMode('stop')
	}, [])

	return { start, stop, mode }
}

export default useTimer
