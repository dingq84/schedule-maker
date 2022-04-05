import { v4 as uuidv4 } from 'uuid'

interface ITask {
	id: string
	taskName: string
	isRepeat: boolean
	time: number //millisecond
	countdown?: boolean // 是否開始倒數
	// 起迄時間，超過起訖以外的時間不進行倒數
	startTime?: number // millisecond
	endTIme?: number //millisecond

	start: () => Task
	stop: () => Task
}

export interface TaskProps extends Omit<ITask, 'id' | 'start' | 'stop'> {
	id?: string
}

class Task implements ITask {
	readonly id: string
	taskName: string
	isRepeat: boolean
	time: number
	countdown?: boolean | undefined
	startTime?: number | undefined
	endTIme?: number | undefined

	constructor(props: TaskProps) {
		this.id = props.id ?? uuidv4()
		this.taskName = props.taskName
		this.isRepeat = props.isRepeat
		this.time = props.time

		this.countdown = props.countdown ?? false
		this.startTime = props.startTime
		this.endTIme = props.endTIme
	}

	get humanTime(): string {
		const seconds = this.time / 1000
		const hour = Math.floor(seconds / 3600)
		const minute = Math.floor((seconds - hour * 3600) / 60)
		const second = Math.floor(seconds - hour * 3600 - minute * 60)

		if (hour) {
			return `${hour} hour ${minute} min ${second} sec`
		} else if (minute) {
			return `${minute} min ${second} sec`
		} else {
			return `${second} sec`
		}
	}

	start(): Task {
		return new Task({ ...this, countdown: true })
	}

	stop(): Task {
		return new Task({ ...this, countdown: false })
	}

	startCountdown(): Task {
		if (this.time) {
			return new Task({ ...this, time: this.time - 1000 })
		}

		this.notify()
		return new Task({ ...this, countdown: false })
	}

	notify(): void {
		new Notification(this.taskName, { body: '時間到囉' })
	}
}

export default Task
