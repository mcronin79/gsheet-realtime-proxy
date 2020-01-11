const got = require(`got`)
const createApi = require(`./sheetsy.js`)

const defaultGet = url => got(url).then(response => JSON.parse(response.body))

module.exports = createApi(defaultGet)
