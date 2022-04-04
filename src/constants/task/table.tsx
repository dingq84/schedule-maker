// types
import { CustomColumn } from '../../components/shared/table'
import Task from '../../models/Task'

const columns: CustomColumn<Task>[] = [
	{
		Header: 'TaskName',
		accessor: 'name',
		width: 250,
	},
	{
		Header: 'Timer',
		accessor: 'humanTime',
		width: 200,
	},
	{
		Header: 'Action',
		width: 150,
		cellSlot: 'action',
	},
]

export default columns
