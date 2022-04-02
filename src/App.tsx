import MainLayout from './layout/main'

function App() {
	return (
		<div className="w-screen h-screen">
			<MainLayout>
				<main className="bg-gray-secondary-300 flex-grow px-[30px] py-12">
					<h1 className="text-gray-secondary-900 text-4xl tracking-tight font-bold">Welcome</h1>
				</main>
			</MainLayout>
		</div>
	)
}

export default App
