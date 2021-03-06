// @ts-ignore
import { useState, Fragment, startTransition, useEffect, useRef } from 'react'
import { Dialog, Switch, Transition } from '@headlessui/react'
import { useForm, Controller } from 'react-hook-form'
import { PlusIcon, PlayIcon, PauseIcon, TrashIcon } from '@heroicons/react/solid'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Row } from 'react-table'

import Task, { TaskProps } from '../models/Task'
import Table from '../components/shared/table'
import columns from '../constants/task/table'
import ClientDatabase from '../models/ClientDatabase'
import useTimer from '../hooks/useTimer'

const schema = yup
	.object({
		taskName: yup.string().required('Task name is required'),
		isRepeat: yup.boolean().required(),
		hour: yup
			.number()
			.typeError('hour must be a number')
			.min(0)
			.max(24)
			.test('oneOfRequired', 'One of hour, minute, second must be greater than zero', function () {
				return this.parent.hour !== 0 || this.parent.minute !== 0 || this.parent.second !== 0
			}),
		minute: yup
			.number()
			.typeError('minute must be a number')
			.min(0)
			.max(60)
			.test('oneOfRequired', 'One of hour, minute, second must be greater than zero', function () {
				return this.parent.hour !== 0 || this.parent.minute !== 0 || this.parent.second !== 0
			}),
		second: yup
			.number()
			.typeError('second must be a number')
			.min(0)
			.max(60)
			.test('oneOfRequired', 'One of hour, minute, second must be greater than zero', function () {
				return this.parent.hour !== 0 || this.parent.minute !== 0 || this.parent.second !== 0
			}),
	})
	.required()

interface TaskForm extends Omit<TaskProps, 'time' | 'startTime' | 'endTime'> {
	hour: number
	minute: number
	second: number
}

const Tasks: React.FC = () => {
	const [tasks, setTasks] = useState<Task[]>([])
	const [isOpen, setIsOpen] = useState(false)
	const [isDeleteOpen, setIsDeleteOpen] = useState(false)
	const [taskId, setTaskId] = useState('')
	const clientDatabase = useRef(new ClientDatabase('taskDatabase', 1, 'task'))
	const db = useRef<IDBDatabase>(null!)

	const {
		register,
		handleSubmit,
		control,
		formState: { errors },
		clearErrors,
		watch,
		reset,
	} = useForm<TaskForm>({
		resolver: yupResolver(schema),
		defaultValues: {
			isRepeat: false,
			hour: 0,
			minute: 0,
			second: 0,
		},
	})

	const handleUpdateTime = (): void => {
		setTasks((previous) => previous.map((task) => (task.countdown ? task.startCountdown() : task)))
	}

	const { start, stop, mode } = useTimer({ callback: handleUpdateTime })

	watch(['hour', 'minute', 'second'])

	useEffect(() => {
		// TODO: ??????????????? react hook form ???????????????????????????
		const subscription = watch(() => {
			clearErrors(['hour', 'minute', 'second'])
		})

		return () => subscription.unsubscribe()
	}, [watch, clearErrors])

	useEffect(() => {
		async function getDbData(database: IDBDatabase) {
			const data = await clientDatabase.current.getDataByKey<TaskProps>(database)
			setTasks(data.map((item) => new Task(item)))
		}

		async function openDb() {
			const database = await clientDatabase.current.openDatabase()
			db.current = database
			getDbData(database)
		}

		openDb()
	}, [])

	useEffect(() => {
		// ?????????????????????????????????????????????????????????????????????????????????
		if (mode !== 'start' && tasks.some((task) => task.countdown)) {
			start()
			// ???????????????????????????????????????
		} else if (tasks.every((task) => !task.countdown)) {
			stop()
		}
	}, [tasks, start, stop, mode])

	const openModal = (): void => {
		setIsOpen(true)
	}

	const closeModal = (): void => {
		setIsOpen(false)
		startTransition(() => {
			reset()
		})
	}

	const createTask = (data: TaskProps): void => {
		const { taskName, ...restData } = data
		const safeName = taskName.replace(/</g, '').replace(/>/g, '')
		const task = new Task({ ...restData, taskName: safeName })
		clientDatabase.current.addData<Task>(db.current, task)

		setTasks((previous) => [...previous, task])
	}

	const onSubmit = (data: TaskForm): void => {
		const { hour, minute, second, ...restData } = data
		const time = (hour * 60 * 60 + minute * 60 + second) * 1000
		createTask({ ...restData, time })
		closeModal()
	}

	const handleStop = (data: Row<Task>): void => {
		const index = tasks.findIndex((task) => task.id === data.original.id)
		const newTask = data.original.stop()
		setTasks([...tasks.slice(0, index), newTask, ...tasks.slice(index + 1, tasks.length)])
	}

	const handleStart = (data: Row<Task>): void => {
		const index = tasks.findIndex((task) => task.id === data.original.id)
		const newTask = data.original.start()
		setTasks([...tasks.slice(0, index), newTask, ...tasks.slice(index + 1, tasks.length)])
	}

	const handleDelete = (): void => {
		setTasks((previous) => previous.filter((task) => task.id !== taskId))
		closeDeleteDialog()
		startTransition(() => {
			setTaskId('')
		})
	}

	const openDeleteDialog = (data: Row<Task>): void => {
		setTaskId(data.original.id)
		setIsDeleteOpen(true)
	}

	const closeDeleteDialog = (): void => {
		setIsDeleteOpen(false)
	}

	return (
		<main className="bg-gray-secondary-300 flex-grow px-2 py-6 overflow-hidden flex flex-col  md:px-[30px] md:py-12">
			<div className="flex justify-between flex-shrink-0 mb-5">
				<h1 className="text-gray-secondary-900 text-4xl tracking-tight font-bold">Tasks</h1>
				<button onClick={openModal}>
					<PlusIcon className="h-7 w-7 text-indigo-700 hover:opacity-80" />
				</button>
			</div>

			<Table<Task>
				columns={columns}
				data={tasks}
				pagination={{
					pageSize: 10,
					currentPage: 1,
					lastPage: 1,
					totalRows: tasks.length,
					nextPage: (pageCount) => {},
					goPage: (page) => {},
				}}
				slots={{
					action: (data) => (
						<>
							{data.original.countdown ? (
								<button onClick={() => handleStop(data)} type="button">
									<PauseIcon className="text-gray-secondary-900 w-6 h-6" />
								</button>
							) : (
								<button onClick={() => handleStart(data)} type="button">
									<PlayIcon className="text-gray-secondary-900 w-6 h-6" />
								</button>
							)}
							<button onClick={() => openDeleteDialog(data)} type="button" className="ml-1">
								<TrashIcon className="text-gray-secondary-900 w-6 h-6" />
							</button>
						</>
					),
				}}
			/>

			<Transition appear show={isDeleteOpen} as={Fragment}>
				<Dialog as="div" className="fixed inset-0 z-10 overflow-y-auto" onClose={closeDeleteDialog}>
					<div className="min-h-screen px-4 text-center">
						<Transition.Child
							as={Fragment}
							enter="ease-out duration-300"
							enterFrom="opacity-0"
							enterTo="opacity-100"
							leave="ease-in duration-200"
							leaveFrom="opacity-100"
							leaveTo="opacity-0"
						>
							<Dialog.Overlay className="fixed inset-0" />
						</Transition.Child>
						<span className="inline-block h-screen align-middle" aria-hidden="true">
							&#8203;
						</span>
						<Transition.Child
							as={Fragment}
							enter="ease-out duration-300"
							enterFrom="opacity-0 scale-95"
							enterTo="opacity-100 scale-100"
							leave="ease-in duration-200"
							leaveFrom="opacity-100 scale-100"
							leaveTo="opacity-0 scale-95"
						>
							<div className="inline-block text-left transition-all transform bg-white shadow-xl rounded-2xl max-w-md p-6 my-8 overflow-hidden">
								<Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
									Delete Task
								</Dialog.Title>
								<p className="text-sm text-gray-500 mt-2">
									Are you sure you want to delete
									<strong className="text-lg text-gray-dark-900">
										{` ${tasks.find((task) => task.id === taskId)?.taskName || ''}`}
									</strong>
								</p>
								<div className="mt-4 flex justify-end items-center">
									<button
										type="button"
										onClick={closeDeleteDialog}
										className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-900 opacity-70 bg-gray-100 border border-transparent rounded-md hover:bg-gray-200 hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
									>
										Close
									</button>
									<button
										type="button"
										onClick={handleDelete}
										className="ml-4 inline-flex justify-center px-4 py-2 text-sm font-medium text-blue-900 bg-blue-100 border border-transparent rounded-md hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
									>
										Delete
									</button>
								</div>
							</div>
						</Transition.Child>
					</div>
				</Dialog>
			</Transition>

			<Transition appear show={isOpen} as={Fragment}>
				<Dialog as="div" className="fixed inset-0 z-10 overflow-y-auto" onClose={closeModal}>
					<div className="min-h-screen px-4 text-center">
						<Transition.Child
							as={Fragment}
							enter="ease-out duration-300"
							enterFrom="opacity-0"
							enterTo="opacity-100"
							leave="ease-in duration-200"
							leaveFrom="opacity-100"
							leaveTo="opacity-0"
						>
							<Dialog.Overlay className="fixed inset-0" />
						</Transition.Child>
						<span className="inline-block h-screen align-middle" aria-hidden="true">
							&#8203;
						</span>
						<Transition.Child
							as={Fragment}
							enter="ease-out duration-300"
							enterFrom="opacity-0 scale-95"
							enterTo="opacity-100 scale-100"
							leave="ease-in duration-200"
							leaveFrom="opacity-100 scale-100"
							leaveTo="opacity-0 scale-95"
						>
							<form
								className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl"
								onSubmit={handleSubmit(onSubmit)}
							>
								<Dialog.Title as="h3" className="text-2xl font-medium leading-6 text-gray-900">
									Create Task
								</Dialog.Title>

								<div className="mt-8">
									<label className="text-gray-secondary-600">
										Task Name
										<input
											{...register('taskName')}
											className="ml-2 outline-none rounded-lg px-3 py-1 text-gray-800 border-gray-secondary-600 border-2 border-solid focus:border-gray-secondary-900"
										/>
									</label>

									<Transition show={Boolean(errors.taskName)} as={Fragment}>
										<div className="mt-1">
											<Transition.Child
												as={Fragment}
												enter="ease-out duration-300"
												enterFrom="opacity-0 scale-95"
												enterTo="opacity-100 scale-100"
												leave="ease-in duration-200"
												leaveFrom="opacity-100 scale-100"
												leaveTo="opacity-0 scale-95"
											>
												<span className="block text-red-400 text-sm">
													{errors.taskName?.message}
												</span>
											</Transition.Child>
										</div>
									</Transition>
								</div>

								<div className="mt-4 flex items-center">
									<span className="text-gray-secondary-600">Repeat</span>

									<Controller
										name="isRepeat"
										control={control}
										render={({ field: { ref, value, ...rest } }) => (
											<Switch
												checked={value}
												{...rest}
												className={`${value ? 'bg-green-primary-100' : 'bg-gray-secondary-600'}
          ml-2 relative inline-flex flex-shrink-0 h-6 w-12 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus-visible:ring-2  focus-visible:ring-white focus-visible:ring-opacity-75`}
											>
												<span
													aria-hidden="true"
													className={`${value ? 'translate-x-6' : 'translate-x-0'}
            pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transform ring-0 transition ease-in-out duration-200`}
												/>
											</Switch>
										)}
									/>
								</div>

								<div className="mt-4">
									<label className="text-gray-secondary-600">
										Timer
										<input
											{...register('hour')}
											className="ml-2 mr-1 w-14 outline-none rounded-lg px-3 py-1 text-gray-800 border-gray-secondary-600 border-2 border-solid focus:border-gray-dark-900"
										/>
										hour
										<input
											{...register('minute')}
											className="mx-1 w-14 outline-none rounded-lg px-3 py-1 text-gray-800 border-gray-secondary-600 border-2 border-solid focus:border-gray-dark-900"
										/>
										min
										<input
											{...register('second')}
											className="mx-1 w-14 outline-none rounded-lg px-3 py-1 text-gray-800 border-gray-secondary-600 border-2 border-solid focus:border-gray-dark-900"
										/>
										sec
									</label>

									<Transition
										show={Boolean(errors.hour || errors.minute || errors.second)}
										as={Fragment}
									>
										<div className="mt-1">
											<Transition.Child
												as={Fragment}
												enter="ease-out duration-300"
												enterFrom="opacity-0 scale-95"
												enterTo="opacity-100 scale-100"
												leave="ease-in duration-200"
												leaveFrom="opacity-100 scale-100"
												leaveTo="opacity-0 scale-95"
											>
												<span className="block text-red-400 text-sm">
													{(errors.hour || errors.minute || errors.second)?.message}
												</span>
											</Transition.Child>
										</div>
									</Transition>
								</div>

								<div className="mt-8 flex justify-end items-center">
									<button
										type="button"
										onClick={closeModal}
										className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-900 opacity-70 bg-gray-100 border border-transparent rounded-md hover:bg-gray-200 hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
									>
										Close
									</button>
									<button
										type="submit"
										className="ml-4 inline-flex justify-center px-4 py-2 text-sm font-medium text-blue-900 bg-blue-100 border border-transparent rounded-md hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
									>
										Create
									</button>
								</div>
							</form>
						</Transition.Child>
					</div>
				</Dialog>
			</Transition>
		</main>
	)
}

export default Tasks
