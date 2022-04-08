// types
import { CustomColumn } from '../../components/shared/table'
import Task from '../../models/Task'

const columns: CustomColumn<Task>[] = [
	{
		Header: 'TaskName',
		accessor: 'taskName',
		width: 140,
	},
	{
		Header: 'Timer',
		accessor: 'humanTime',
		width: 130,
	},
	{
		Header: 'Action',
		width: 60,
		cellSlot: 'action',
	},
]

export default columns
