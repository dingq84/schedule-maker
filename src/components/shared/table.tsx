import { memo, useMemo, useState, useRef, HTMLAttributes, useCallback, useEffect } from 'react'
import {
	useTable,
	useFlexLayout,
	useResizeColumns,
	usePagination,
	useSortBy,
	Row,
	TableOptions,
	SortingRule,
	CellProps,
	Column,
	Renderer,
} from 'react-table'

export type CustomColumn<T extends object = {}, D extends object = {}, V = any> = Column<T> & {
	align?: 'left' | 'center' | 'right'
	// header 和 cell 代表 table header 和 cell 是否需要外來 component
	headerSlot?: string
	cellSlot?: string
	// react table 的 column type 遺失 cell property，這邊新增一個幫助 ts 檢查
	Cell?: Renderer<CellProps<D, V>>
}

interface TableProps<T extends object> extends HTMLAttributes<HTMLDivElement> {
	columns: CustomColumn<T>[]
	data: Array<T>
	headerFixed?: boolean
	disabledPagination?: boolean
	handleRowClick?: (data: Row<T>) => void
	handleSort?: (data: SortingRule<T>[]) => void
	tableOptions?: Partial<TableOptions<T>>
	slots?: {
		[key: string]: (data: Row<T>) => JSX.Element
	}
	pagination: {
		currentPage: number // 目前第幾頁
		lastPage: number // 最後一頁
		totalRows: number // 總共幾筆
		nextPage: (page: number) => void // 換頁 call api
		goPage: (page: number) => void // 換頁 call api
		pageSize?: number
	}
}

function calculatePagination(currentPage: number, lastPage: number): number[] {
	const start =
		currentPage === lastPage ? Math.max(1, currentPage - 8) : Math.max(1, currentPage - 4)
	const end = Math.min(lastPage, start + 8)
	const length = end - start + 1

	return Array.from(Array(length), (_, index) => index + start)
}

const Table = <T extends object>(props: TableProps<T>) => {
	const {
		columns,
		data,
		headerFixed = true,
		pagination,
		disabledPagination = false,
		tableOptions = {},
		slots,
		handleRowClick,
		handleSort,
		...restProps
	} = props
	const {
		currentPage,
		lastPage,
		totalRows,
		pageSize = 10,
		nextPage: propNextPage,
		goPage,
	} = pagination

	const [totalWidth, setTotalWidth] = useState(0)
	const ref = useRef<HTMLDivElement>(null!)
	const getColumnsSlot = useCallback(
		(slotName: string) => {
			if (slots === undefined) {
				return () => <span>{`請提供 ${slotName} 的 FC`}</span>
			}

			return slots[slotName]
		},
		[slots]
	)
	// 官方建議將 column 和 data 做 useMemo
	const memoColumns = useMemo(
		() =>
			columns.map((column) => {
				if (column.headerSlot) {
					column.Header = ({ row }: { row: Row<T> }) => getColumnsSlot(column.headerSlot!)(row)
				} else if (column.cellSlot) {
					column.Cell = ({ row }: { row: Row<T> }) => getColumnsSlot(column.cellSlot!)(row)
				}

				return column
			}),
		[columns, getColumnsSlot]
	)
	const memoData = useMemo(() => data, [data])
	const defaultColumn = useMemo(
		() => ({
			minWidth: 30,
			width: 150,
			maxWidth: 600,
			disableSortBy: true,
		}),
		[]
	)
	const {
		getTableProps,
		getTableBodyProps,
		headerGroups,
		rows,
		prepareRow,
		state,
		canPreviousPage,
		canNextPage,
		previousPage,
		nextPage,
		gotoPage,
	} = useTable<T>(
		{
			columns: memoColumns,
			data: memoData,
			defaultColumn,
			manualPagination: true,
			pageCount: Math.ceil(totalRows / pageSize),
			manualSortBy: true,
			disableSortRemove: true,
			...tableOptions,
		},
		useFlexLayout,
		useResizeColumns,
		useSortBy,
		usePagination
	)
	const { pageIndex, sortBy } = state

	useEffect(() => {
		// 取 columns 的 width 總和和實際 element 的 width 兩者間較大的值，並設定回 table header 和 body
		const columnTotalWidth = memoColumns.reduce(
			(accumulate, { width = 0, minWidth = 0, maxWidth = 0 }) =>
				accumulate + Math.max(Number(width), minWidth, maxWidth),
			60
		)
		const { clientWidth } = ref.current
		const actualWidth = clientWidth - 48 // padding x
		setTotalWidth(Math.max(columnTotalWidth, actualWidth))
	}, [memoColumns])

	useEffect(() => {
		if (handleSort) {
			handleSort(sortBy)
		}
	}, [sortBy])

	const handleClick = (data: Row<T>): void => {
		if (handleRowClick) {
			handleRowClick(data)
		}
	}

	const handlePagination = (page: number): void => {
		if (page > 0) {
			nextPage()
		} else {
			previousPage()
		}

		propNextPage(page)
	}

	const handleSpecificPagination = (page: number): void => {
		gotoPage(page - 1)
		goPage(page)
	}

	return (
		/* eslint-disable react/jsx-key */
		<div
			ref={ref}
			className="rounded-lg w-full p-0 relative overflow-hidden bg-transparent"
			{...restProps}
		>
			<div
				className="scroll w-full border border-solid border-gray-200 rounded-lg"
				{...getTableProps()}
			>
				<div className={`${headerFixed ? 'sticky top-0' : ''}`} style={{ minWidth: totalWidth }}>
					{headerGroups.map((headerGroup) => (
						<div
							{...headerGroup.getHeaderGroupProps()}
							className="px-6 py-4 border-b border-solid border-gray-200 bg-indigo-200 flex"
						>
							{headerGroup.headers.map((column) => (
								<div
									className="text-gray-800 text-xs font-medium flex justify-start items-center"
									{...column.getHeaderProps(column.getSortByToggleProps())}
								>
									{column.render('Header')}
									{/* {column.isSorted ? (
										<FontAwesomeIcon tw="ml-2" icon={column.isSortedDesc ? faSortDown : faSortUp} />
									) : null} */}
								</div>
							))}
						</div>
					))}
				</div>

				{rows.length ? (
					<div
						{...getTableBodyProps()}
						style={{ minWidth: totalWidth, height: 'calc(100% - 49px)' }}
					>
						{rows.map((row) => {
							prepareRow(row)
							return (
								<div
									{...row.getRowProps()}
									className="px-6 py-4 text-black border-b border-solid border-gray-200 cursor-pointer hover:bg-[#E9EBF6]"
									onClick={() => handleClick(row)}
								>
									{row.cells.map((cell, i) => {
										return (
											<div
												className={`${
													columns[i].align === 'center'
														? 'text-center'
														: columns[i].align === 'right'
														? 'text-right'
														: ''
												} text-sm text-black font-normal text-ellipsis overflow-hidden px-1`}
												{...cell.getCellProps()}
											>
												{cell.render('Cell')}
											</div>
										)
									})}
								</div>
							)
						})}
					</div>
				) : (
					<h3 className="text-lg text-center leading-8 text-gray-dark-900">No Data</h3>
				)}
			</div>

			{totalRows ? (
				<div className="mt-2.5 h-4 pr-2">
					<span className="float-right text-xs text-black font-normal">{`1 - ${totalRows} of ${totalRows}`}</span>
				</div>
			) : null}
		</div>
	)
}

export default memo(Table, (prevProps, nextProps) => {
	if (prevProps.columns.length !== nextProps.columns.length) {
		return false
	} else if (JSON.stringify(prevProps.data) !== JSON.stringify(nextProps.data)) {
		return false
	} else if (prevProps.pagination?.currentPage !== nextProps.pagination?.currentPage) {
		return false
	}

	return true
}) as typeof Table
