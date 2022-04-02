import Sidebar from '../components/layout/sidebar'

const MainLayout: React.FC = (props) => {
	const { children } = props
	return (
		<div className="w-full h-full flex items-stretch">
			<Sidebar />
			{children}
		</div>
	)
}

export default MainLayout
