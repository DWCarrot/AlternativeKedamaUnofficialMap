
function FileOperation(zIndex) {
	this.zIndex = zIndex || 5000;
	this.createDownloadDialog = function(a, width, height, tip) {
		if(width === undefined)
			width = 200;
		if(height === undefined)
			height = 150;
		let body = document.getElementsByTagName("body")[0];
		let container = document.createElement("div");
		let left = 0.5 * (window.innerWidth - width);
		let top = 0.5 * (window.innerHeight - height);
		container.style = 'background-color: #EEE; '
						+ 'position: fixed; '
						+ 'left: ' + left + 'px; '
						+ 'top: ' + top + 'px; '
						+ 'z-index: ' + this.zIndex + '; '
						+ 'width: ' + width + 'px; '
						+ 'height: ' + height + 'px; '
						+ 'box-shadow: 2px 2px 4px 4px #BBB; '
						+ 'border: 2px solid silver; ';
		
		let head = document.createElement("div");
		head.style = "border-bottom: 1px solid silver;"
		let ocp = document.createElement("span");
		ocp.innerHTML = "&nbsp;";
		ocp.style = "text-align: center";
		let cancel = document.createElement("input");
		cancel.type = "button";
		cancel.value = "X";
		cancel.style = "float: right;";
		cancel.addEventListener('click', function(e) {
			body.removeChild(container);
		});
		head.appendChild(ocp);
		head.appendChild(cancel);
		
		let line = document.createElement("div");
		a.addEventListener('click',function(e) {
			body.removeChild(container);
		});
		line.appendChild(a);
		
		container.appendChild(head);
		if(tip instanceof HTMLElement)
			container.appendChild(tip);
		container.appendChild(line);
		
		
		body.appendChild(container);
		return container;
	};
	this.createUploadDialog = function(handle, width, height) {
		if(width === undefined)
			width = 200;
		if(height === undefined)
			height = 150;
		if(handle === undefined)
			handle = console.log;
		let body = document.getElementsByTagName("body")[0];
		let container = document.createElement("div");
		let left = 0.5 * (window.innerWidth - width);
		let top = 0.5 * (window.innerHeight - height);
		container.style = 'background-color: #EEE; '
						+ 'position: absolute; '
						+ 'left: ' + left + 'px; '
						+ 'width: ' + width + 'px; '
						+ 'top: ' + top + 'px; '
						+ 'height: ' + height + 'px; '
						+ 'box-shadow: 2px 2px 1px 1px #BBB; ';
		body.appendChild(container);
		let input = document.createElement("input");
		input.type = 'file';
		input.placeholder = 'file';
		let confirm = document.createElement("button");
		confirm.innerHTML = "confirm"
		confirm.addEventListener('click', function(e) {
			body.removeChild(container);
			handle(input.files);
		});
		let cancel = document.createElement("button");
		cancel.innerHTML = "cancel"
		cancel.addEventListener('click', function(e) {
			body.removeChild(container);
		});	
		container.appendChild(confirm);
		container.appendChild(cancel);
		container.appendChild(input);
	};
	this.uploadJSON = function(file, handle) {			
		let reader = new FileReader();
		if(handle === undefined || handle === null)
			handle = console.log;
		reader.readAsText(file);
		reader.onload = function() {
			let obj;
			try {
				obj = JSON.parse(reader.result);
			} catch(e) {
				console.log(e);
				obj = null;
			}
			handle(obj);
		}
	};
	this.downloadFile = function(fileName, content, type) {
		if(type === undefined || type === null)
			type = "application/octet-stream";
		let a = document.createElement("a");
		let blob = new Blob([content], {type: type});
		a.download = fileName;
		a.href = URL.createObjectURL(blob);
		a.innerHTML = 'click to download';
		return a;
	};
}