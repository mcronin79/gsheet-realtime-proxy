const { buildIndexUrl, buildSheetUrl } = require(`./url-builder.js`)
const entries = require(`ordered-entries`)
const got = require(`got`)

const defaultGet = url => got(url).then(response => JSON.parse(response.body))

let getWorkbook = (key, get = defaultGet) => {
	return get(buildIndexUrl(key)).then(workbookData => {
		const feed = workbookData.feed
		const sheets = feed.entry.map(sheetData => {
			const selfSheetUrl = sheetData.link.find(link => link.rel === `self`).href
			return {
				name: textOf(sheetData.title),
				id: afterLastSlash(selfSheetUrl),
				updated: textOf(sheetData.updated),
			}
		})
		return {
			name: textOf(feed.title),
			updated: textOf(feed.updated),
			authors: getAuthors(feed),
			sheets,
		}
	})
}


let getSheet = (key, id, get = defaultGet) => {
	return get(buildSheetUrl(key, id)).then(sheetData => {
		//const range = sheetData.range
		const rows = sheetData.values
		//const rows = (feed.entry || []).map(entry => {
			//const originalCellKeysAndValues = entries(entry)
			//	.filter(([ key ]) => /^gsx\$/.test(key))
			//	.map(([ key, value ]) => ({
			//		key: key.replace(`gsx$`, ``),
			//		value: textOf(value),
			//	}))
			//const array = originalCellKeysAndValues.map(({ value }) => value)
			//originalCellKeysAndValues
			//	.filter(({ key }) => /^[^_]/.test(key))
			//	.forEach(({ key, value }) => {
			//		array[key] = value
			//	})
			//return feed
		//})
		return {
			//name: textOf(feed.title),
			//updated: textOf(feed.updated),
			//authors: getAuthors(feed),
			rows,
		}
	})
}

let urlToKey = (url) => {
	return firstCapture(/key=(.*?)(&|#|$)/, url)
		|| firstCapture(/d\/(.*?)\/pubhtml/, url)
		|| firstCapture(/spreadsheets\/d\/(.*?)\//, url)
		|| toss(`No key found in ${ url }`)
}


module.exports={
   getWorkbook : getWorkbook,
   getSheet : getSheet,
   urlToKey : urlToKey
};

const textOf = field => field.$t

const getAuthors = data => data.author.map(({ name, email }) => ({
	name: textOf(name),
	email: textOf(email),
}))

const afterLastSlash = str => str.split(`/`).pop()

const firstCapture = (regex, str) => {
	const match = regex.exec(str)
	return match && match[1]
}

const toss = message => {
	throw new Error(message)
}
