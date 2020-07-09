var zindex = 100


export function createWindow(id, title, size, content) {
	var main = document.createElement('div')
	main.id = id
	main.classList.add('window_main')

	main.style = `
		position: absolute;
		z-index: ${zindex};
		background-color: #eeeeeedd;
		top: calc(50vh - ${size[1]}/2);
		left: calc(50vw - ${size[0]}/2);
		`

	main.style.width = size[0]
	main.style.height = size[1]

	main.onclick = function() {
		zindex++
		main.style.zIndex = zindex
	}

	var bar = document.createElement('div')
	bar.id = id + '_bar'
	bar.style = `
		padding: 10px;
		cursor: move;
		z-index: 1;
		background-color: #2b2b2bee;
		color: #fff;
		text-align: center;
	`
	bar.style.width = '100%'
	bar.style.height = '40px'
	bar.innerHTML = title
	bar.classList.add('window_bar')


	var close = document.createElement('div')
	close.id = id + '_close'
	close.style = `
		cursor: pointer;
		z-index: 2;
		background-color: #dd444466;
		float: right;
		color: #fff;
		border-radius: 50%;
	`
	close.style.width = '20px'
	close.style.height = '20px'
	close.onclick = function() { 
		main.style.display = 'none'
		main.style.top = `calc(50vh - ${size[1]}/2);`
		main.style.left =  `calc(50vw - ${size[0]}/2);`
	}

	close.classList.add('window_close')


	main.appendChild(bar)
	bar.appendChild(close)
	main.appendChild(content)


	var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
	bar.onmousedown = function(e) {
		e = e || window.event
		e.preventDefault()
		zindex++
		main.style.zIndex = zindex
		// get the mouse cursor position at startup:
		pos3 = e.clientX
		pos4 = e.clientY
		document.onmouseup = closeDragElement
		// call a function whenever the cursor moves:
		document.onmousemove = elementDrag
  	}

	function elementDrag(e) {
		e = e || window.event;
		e.preventDefault();
		// calculate the new cursor position:
		pos1 = pos3 - e.clientX;
		pos2 = pos4 - e.clientY;
		pos3 = e.clientX;
		pos4 = e.clientY;
		// set the element's new position:
		main.style.top = (main.offsetTop - pos2) + "px";
		main.style.left = (main.offsetLeft - pos1) + "px";
  }

	function closeDragElement() {
		// stop moving when mouse button is released:
 		document.onmouseup = null;
 		document.onmousemove = null;
  	}

	return {main: main, bar: bar, close: close}
}


window.createWindow = createWindow
