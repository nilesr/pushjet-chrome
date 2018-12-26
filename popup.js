//const API_BASE = "https://seattle.niles.xyz/pushjet-bridge";
const API_BASE = "http://10.0.0.14/pushjet-bridge";
var uuid_get = function uuid_get() {
	return localStorage.getItem("uuid");
}
var uuid_set = function uuid_set() {
	var uuid = document.getElementById("uuid");
	var uuid_btn = document.getElementById("uuid_btn");
	localStorage.setItem("uuid", uuid.value);
	uuid.disabled = true;
	uuid_btn.innerText = "Change";
}
var uuid_change = function uuid_change() {
	var uuid = document.getElementById("uuid");
	var uuid_btn = document.getElementById("uuid_btn");
	uuid.disabled = false;
	uuid_btn.innerText = "Set";
}
var uuid_btn_click = function uuid_btn_click() {
	var uuid = document.getElementById("uuid");
	if (uuid.disabled) {
		uuid_change();
	} else {
		uuid_set();
	}
}
var do_post = function do_post(route, data, success, error) {
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function xhr_readystatechange() {
		if (xhr.readyState != xhr.DONE) return;
		if (xhr.status == 200) {
			success(JSON.parse(xhr.responseText));
		} else {
			error(xhr.responseText);
		}
	}
	xhr.open("POST", API_BASE + route, true);
	var fd = new FormData();
	for (var key in data) {
		fd.append(key, data[key]);
	}
	xhr.send(fd);
}
var do_get = function do_post(route, data, success, error) {
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function xhr_readystatechange() {
		if (xhr.readyState != xhr.DONE) return;
		if (xhr.status == 200) {
			success(JSON.parse(xhr.responseText));
		} else {
			error(xhr.responseText);
		}
	}
	var query = "";
	for (var key in data) {
		if (query.length == 0) {
			query += "?";
		} else {
			query += "&";
		}
		query += encodeURIComponent(key) + "=" + encodeURIComponent(data[key]);
	}
	xhr.open("GET", API_BASE + route + query, true);
	xhr.send();
}
var subscribe_btn_click = function subscribe_btn_click() {
	var newid = document.getElementById("subscribe").value;
	do_post("/subscription", {"uuid": uuid_get(), "service": newid}, function success() {
		alert("Success");
		refresh();
	}, function error(e) {
		alert("Error " + (e || "null").toString());
	});
}
var messages_get = function messages_get() {
	var ms = localStorage.getItem("messages");
	if (ms == null || ms == undefined || ms.length == 0 || ms[0] != '[') {
		return [];
	}
	return JSON.parse(ms);
}
var refresh = function refresh() {
	do_get("/message", {"uuid": uuid_get()}, function success(data) {
		var messages = data["messages"];
		for (var i = 0; i < messages.length; i++) {
			messages[i]["new"] = true;
		}
		messages = messages_get().concat(messages);
		messages.sort(function compareFn(a, b) { return b["timestamp"] - a["timestamp"]; });
		localStorage.setItem("messages", JSON.stringify(messages));
		render();
	}, function error(e) {
		alert(e);
	});
}
var render = function render() {
	var container = document.getElementById("main");
	container.innerHTML = "";
	var ms = messages_get();
	ms.forEach(function(m) {
		var div = document.createElement("div");
		var img = document.createElement("img");
		img.src = m["service"]["icon"];
		img.style.width = "100px";
		div.appendChild(img);
		var sdiv = document.createElement("span"); // for inline-block
		var service = document.createElement("span");
		service.innerText = m["service"]["name"];
		service.title = m["service"]["public"];
		service.style.fontWeight = "bold";
		service.style.color = m["new"] ? "red" : "default";
		sdiv.appendChild(service);
		var time = document.createElement("span");
		time.innerText = m["timestamp"] + " - "; // TODO localize
		sdiv.appendChild(time);
		if (m["title"].length > 0) {
			var title = document.createElement("span");
			title.innerText = m["title"];
			sdiv.appendChild(title);
		}
		var url = (m["url"] || "").length > 0;
		var msg = document.createElement(url ? "a" : "span");
		if (url) {
			msg.href = m["url"];
		}
		msg.innerText = m["message"];
		msg.addEventListener("click", function() {
			/*
			var inp = document.createElement("input");
			inp.value = m["message"];
			document.body.appendChild(inp);
			inp.focus();
			document.execCommand("copy");
			inp.outerHTML = "";
			*/
			navigator.clipboard.writeText(m["message"]);
		})
		sdiv.appendChild(msg);
		div.appendChild(sdiv);
		div.style.borderTop = "1px solid grey"
		container.appendChild(div);
	})
}
var send_btn_click = function send_btn_click() {
	var message = document.getElementById("text").value;
	var secret = document.getElementById("secret").value;
	do_post("/message", {"secret": secret, "message": message}, function success() {
		localStorage.setItem("secret", secret);
		refresh();
	}, function error(e) {
		alert(e);
	})
}
// thank you https://github.com/trustpilot/segment-chromeextension/blob/master/popup.js#L103
document.addEventListener("DOMContentLoaded", function ol() {
	document.getElementById("uuid_btn").addEventListener("click", uuid_btn_click);
	document.getElementById("uuid").value = localStorage.getItem("uuid");
	document.getElementById("subscribe_btn").addEventListener("click", subscribe_btn_click);
	document.getElementById("send_btn").addEventListener("click", send_btn_click);
	document.getElementById("secret").value = localStorage.getItem("secret");
	render(); // render saved messages
	refresh();
})