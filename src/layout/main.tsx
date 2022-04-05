import Sidebar from '../components/layout/sidebar'

const MainLayout: React.FC = (props) => {
	const { children } = props
	return (
		<div className="w-full h-full flex overflow-hidden">
			<Sidebar />
			{children}
		</div>
	)
}

export default MainLayout
