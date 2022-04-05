// types
import { CustomColumn } from '../../components/shared/table'
import Task from '../../models/Task'

const columns: CustomColumn<Task>[] = [
	{
		Header: 'TaskName',
		accessor: 'name',
		width: 140,
	},
	{
		Header: 'Timer',
		accessor: 'humanTime',
		width: 140,
	},
	{
		Header: 'Action',
		width: 30,
		cellSlot: 'action',
	},
]

export default columns
