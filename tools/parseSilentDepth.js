//ES6
function parseMarker(url) {
	let p = /\.add\(\"(-?\d+)(?:-(-?\d+))?,(-?\d+)(?:-(-?\d+))?\",\"(\S+?)\"\)/g;
	let req = new XMLHttpRequest();
	let matches = [];
	req.onload = function() {
		let s = req.responseText;
		console.log({s});
		let match = null;
		while (match = p.exec(s)) {
			matches.push(match);
		}
		console.log(matches);
	};
	req.open("GET", url);
	req.send();
	return matches;
}

function generateObj(regList) {
	let res = {};
	let c = 0;
	for(let match of regList) {
		let area = [];
		let xmin = Number.parseInt(match[1]);
		let xmax = Number.parseInt(match[2] || match[1]);
		let zmin = Number.parseInt(match[3]);
		let zmax = Number.parseInt(match[4] || match[3]);
		let color = match[5];
		if(color[0] == '#' && color.length == 1 + 3)
			color = String.prototype.concat.call(color[0], color[1], color[1], color[2], color[2],color[3], color[3]);
		for(let x = xmin; x <= xmax; ++x)
			for(let z = zmin; z <= zmax; ++z)
				area.push({cx:x,cz:z});
		res[String(c++)] = {
			title: "*",
			declarant: "*",
			color: match[5],
			area: area
		}
	}
	return res;
}

function download(res) {
	let a = document.createElement("a");
	let blob = new Blob([JSON.stringify(res)], {type: "application/octet-stream"});
	a.download = "v3-chunkmark.json";
	a.href = URL.createObjectURL(blob);
	a.innerHTML = 'click to download';
	document.querySelector('body').appendChild(a);
	return a;
}
