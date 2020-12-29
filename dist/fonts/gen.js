const fs = require('fs');

const files = fs.readdirSync('./PixelOperator')

let out = ''


files.forEach((x) => {
	const f2 = x.replace('.ttf', '')

	out = out + `
	@font-face {
		font-family: '${f2}';
		src: url('./fonts/PixelOperator/${f2}.ttf') format('truetype')
	}
	`

	console.log(`'${f2}',`)
})


