import { useEffect, useState } from 'react'
import MainLayout from './layout/main'

import Tasks from './pages/tasks'

function App() {
	const [height, setHeight] = useState<number | string>('100vh')

	useEffect(() => {
		setHeight(window.innerHeight)
		const errorMessage =
			'Your browser does not yet support the notification function, which may affect your experience'
		function handlePermission(result: NotificationPermission) {
			switch (result) {
				case 'granted':
					break
				default:
					alert(errorMessage)
			}
		}

		if (!window.Notification) {
			console.warn('瀏覽器並未支援')
			alert(errorMessage)
		} else {
			try {
				// Safari doesn't return a promise for requestPermissions and it throws a TypeError.
				Promise.resolve(Notification.requestPermission()).then(handlePermission)
			} catch (error) {
				alert(errorMessage)
			}
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
