/* eslint-disable no-undef */
/* eslint-disable no-restricted-globals */
if (typeof importScripts === 'function') {
	importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.0.0/workbox-sw.js')
	/* global workbox */
	if (workbox) {
		// console.log('Workbox is loaded')
		workbox.core.skipWaiting()

		workbox.core.setCacheNameDetails({
			prefix: 'schedule-maker',
			suffix: 'v1',
			precache: 'precache',
			runtime: 'runtime',
		})
		/* injection point for manifest files.  */
		workbox.precaching.precacheAndRoute(self.__WB_MANIFEST)

		// Cache google font
		workbox.routing.registerRoute(
			({ url }) => url.origin === 'https://fonts.gstatic.com',
			new workbox.strategies.CacheFirst({
				cacheName: 'google-fonts-stylesheets',
			})
		)

		// Cache google recaptcha
		workbox.routing.registerRoute(
			({ url }) => url.origin === 'https://www.gstatic.com',
			new workbox.strategies.CacheFirst({
				cacheName: 'google-recaptcha',
			})
		)

		// // Catch sheets list
		// workbox.routing.registerRoute(
		//   ({ url }) => /sheet_list/.test(url),
		//   new workbox.strategies.StaleWhileRevalidate({ cacheName: 'adacpro-sheetList' }),
		// )

		// Cache asset_list
		// workbox.routing.registerRoute(
		//   ({ url }) => {
		//     const { searchParams, pathname } = url
		//     const isAssetList = pathname === '/api/asset_list'
		//     const isBondSid = searchParams.get('sid') === '10zOj4QFYnmEsaV9t_LYyCnmjlnGrV4CREoxxqyhTFIc'
		//     return isBondSid && isAssetList
		// },
		//   new workbox.strategies.StaleWhileRevalidate({ cacheName: 'adacpro-assetList' }),
		// )
	} else {
		console.log('Workbox could not be loaded. No Offline support')
	}
}
