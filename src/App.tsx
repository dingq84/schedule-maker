import MainLayout from './layout/main'
import Tasks from './pages/tasks'

function App() {
	return (
		<div className="w-screen h-screen">
			<MainLayout>
				<main className="bg-gray-secondary-300 flex-grow px-[30px] py-12">
					<Tasks />
				</main>
			</MainLayout>
		</div>
	)
}

export default App
