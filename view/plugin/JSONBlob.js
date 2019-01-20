

JSONBlob = new (function() {


	

	/**
	 *
	 *	@param options: {
							method:<String> | "GET",
							success: <function> | console.debug, 
							successContext: <Object> | undefined, 
							fail: <Function> | console.warn, 
							failContext: <Object> | undefined,
							data: <String> | undefined,
							headers: <{"HeaderName":"HeaderValue",...}> | undefined,
							timeout: <Number> | undefined,
						}
	 */
	this.ajax = function(url, options) {
		var opts = {
			method: "GET",
			success: console.debug,
			successContext: undefined,
			fail: console.warn,
			failContext: undefined,
			headers: new Object(),
			data: undefined,
			timeout: 5000,
		}
		for(var p in options)
			opts[p] = options[p];
		var req = new XMLHttpRequest();
		req.onreadystatechange = function () {
			if (req.readyState === 4) {
				if (req.status === 200) {
					return opts.success.call(opts.successContext, req.responseText);
				} else {
					return opts.fail.call(opts.failContext, req.status, req.responseText);
				}
			} else {
				
			}
		}
		req.open(opts.method, url, true);
		if("withCredentials" in req) {
			req.timeout = opts.timeout;
		}
		for(var name in opts.headers) {
			req.setRequestHeader(name, opts.headers[name]);
		}
		req.send(opts.data);
	};
	
	this.baseURL = "https://jsonblob.com/api/jsonBlob/";
	
	this.putJSON = function(id, data, options) {
		options.method = "PUT";
		if(!("headers" in options))
			options.headers = new Object();
		options.headers["Content-Type"] = "application/json";
		options.headers["Accept"] = "application/json";
		options.data = (typeof data === "string") ? data : JSON.stringify(data);
		if(options.success instanceof Function) {
			var callback = options.success;
			options.success = function(jsonStr) {
				callback.call(this, JSON.parse(jsonStr), jsonStr);
			}
		}
		
		this.ajax(this.baseURL + id, options);
	}
	
	this.getJSON = function(id, options) {
		options.method = "GET";
		if(!("headers" in options))
			options.headers = new Object();
		options.headers["Content-Type"] = "application/json";
		options.headers["Accept"] = "application/json";
		if(options.success instanceof Function) {
			var callback = options.success;
			options.success = function(jsonStr) {
				callback.call(this, JSON.parse(jsonStr), jsonStr);
			}
		}
		this.ajax(this.baseURL + id, options);
	}
	
})();