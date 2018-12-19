var Class = (function() {

	var Node = function(obj) {
		this.obj = obj;
		this.priv = null;
		this.next = null;
		this.setProp = function(name, value) {
			this[name] = value;
			return this;
		};
		this.addBefore = function(node) {
			this.priv = node.priv
			this.next = node;
			if(node.priv)
				node.priv.next = this;
			node.priv = this;
			return this;
		};
		this.addAfter = function(node) {
			this.priv = node
			this.next = node.next;
			if(node.next)
				node.next.priv = this;
			node.next = this;
			return this;
		};
		this.remove = function() {
			if(this.priv)
				this.priv.next = this.next;
			if(this.next)
				this.next.priv = this.priv;
			this.priv = null;
			this.next = null;
			return this;
		};
	}


	
	var Class = new (function(){
		
		this.scripts = [];
		this.styles = [];
		
		this._head = new Node(null).setProp("priority", -1);
		this._loading = 0;
		
		this._insert = function(script, priority) {
			for(var p = this._head, q = p.next; q != null && q.priority < priority; p = q, q = p.next);
			return new Node(script).setProp("priority", priority).addAfter(p);
		}
		
		this._nextTask = function(node) {
			node.remove();
			this._loading--;
			if(this._loading == 0) {
				if(this._head.next) {
					this.startTask();
				} else {
					if(this.complete instanceof Function) {
						setTimeout(this.complete, 1000);
						this.complete = undefined;
					}
				}
			}
				
		}
		
		this._onePriority = function() {
			var res = new Array();
			if(this._head.next === null)
				return res;
			for(var p = this._head.next, o = p.priority; p != null && p.priority == o; p = p.next) {
				this._loading++;
				res.push(p.obj);
			}
			return res;
		}
		
		this._listTask = function() {
			var list = new Array();
			for(var p = this._head.next; p != null; list.push(p), p = p.next);
			return list;
		}
		
		this.isCrossOrigin = function(url) {
			var a = document.createElement("a");
			a.href = url;
			return !(location.host == a.host);
		} 
		
		this.loadScript = function(url, integrity, priority) {
			var body = document.getElementsByTagName("body")[0];
			var script = document.createElement("script");
			var scripts = this.scripts;
			var added = false;
			var that = this;
			for(var i = 0; i < scripts.length; ++i) {
				if(scripts[i].src.indexOf(url) === 0) {
					scripts.splice(i, 1, script).remove();
					added = true;
					break;
				}
			}
			if(!added)
				scripts.push(script);
			script.type = 'text/javascript';
			script.src = url;
			if(this.isCrossOrigin(url))
				script.crossOrigin = "anonymous";
			if(integrity)
				script.integrity = integrity;
			if(priority === undefined || priority < 0) {
				body.appendChild(script);
			} else {
				var node = this._insert(script, priority);
				var callback = function(event) {that._nextTask(node);};
				script.addEventListener('load', callback);
				script.addEventListener('error', callback);
			}
			return script;
		};
		
		this.loadStyle = function(url, integrity, priority) {
			var body = document.getElementsByTagName("body")[0];
			var script = document.createElement("link");
			var styles = this.styles;
			var added = false;
			var that = this;
			for(var i = 0; i < styles.length; ++i) {
				if(styles[i].href.indexOf(url) === 0) {
					styles.splice(i, 1, script).remove();
					added = true;
					break;
				}
			}
			if(!added)
				styles.push(script);
			script.rel = "stylesheet";
			script.href = url;
			if(this.isCrossOrigin(url))
				script.crossOrigin = "anonymous";
			if(integrity)
				script.integrity = integrity;
			if(priority === undefined || priority < 0) {
				body.appendChild(script);
			} else {
				var node = this._insert(script, priority);
				var callback = function(event) {that._nextTask(node);};
				script.addEventListener('load', callback);
				script.addEventListener('error', callback);
			}
			return script;
		};
		
		this.startTask = function(complete) {
			if(complete instanceof Function)
				this.complete = complete;
			this._onePriority().forEach(function(s){this.appendChild(s);}, document.getElementsByTagName("body")[0]);
		};
		
		this.forName = function(className) {
			var klass = (new Function('return ' + className))();
			if(klass instanceof Function) {
				return {
					klass: klass,
					newInstance: function(args) {
						var code = "return new klass(";
						for(var i = 0; i < args.length; ++i) {
							if(i > 0)
								code += ",";
							code += ("args[" + i + "]");
						}
						code += ");";
						var constructor = new Function("klass", "args", code);
						return constructor(this.klass, args);
					}
				};
			} else {
				return null;
			}
		};
		
		
	})();
	
	return Class;
})();