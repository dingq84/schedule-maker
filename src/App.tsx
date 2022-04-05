import { useEffect, useState } from 'react'
import MainLayout from './layout/main'
import Tasks from './pages/tasks'

function App() {
	const [height, setHeight] = useState<number | string>('100vh')

	useEffect(() => {
		setHeight(window.innerHeight)

		if (!window.Notification) {
			console.warn('瀏覽器並未支援')
			alert(
				'Your browser does not yet support the notification function, which may affect your experience'
			)
		} else {
			Notification.requestPermission().then(function (result) {
				switch (result) {
					case 'granted':
						break
					default:
						alert(
							'Your browser does not yet support the notification function, which may affect your experience'
						)
				}
			})
		}
	}, [])

	return (
		<div className="w-screen" style={{ height }}>
			<MainLayout>
				<Tasks />
			</MainLayout>
		</div>
	)
}

export default App
