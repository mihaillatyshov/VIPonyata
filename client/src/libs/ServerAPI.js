let IP = ""

export const SetIP = (NewIP) => {
	IP = String(NewIP)
}

const getStrFromParams = (rawParams) => {
	return rawParams ? '?' + Object.keys(rawParams).map((param) => { return `${param}=${rawParams[param]}` }).join('&') : ""
}

// TODO: handle server no response 
const ServerAPI = ({url, method, urlParams, body, onDataReceived, handleStatus, handleServerError, headers}) => {
	console.log("SAPI", IP, url, getStrFromParams(urlParams))
	fetch(IP + url + getStrFromParams(urlParams), {
		method : method,
		headers : headers,
		body : body && JSON.stringify(body)
	}).then(response => {
		console.log("get promise")
		const promise = response.json()
		if (promise !== undefined)
		{
			promise.then((data) => {
				if (response.ok) {
					console.log("handle data")
					onDataReceived && onDataReceived(data)
				}
				else {
					console.log("handle status")
					handleStatus && handleStatus({isOk: response.ok, status: response.status, data: data && data})
				}
			}).catch((err) => {
				console.log("promise error")
				console.log(err);
			})
		}
		/*}).catch((err) => {
			console.log("second hs")
			handleStatus && handleStatus(response.status)
			console.log(err);
		})*/
	}).catch((err) => {
		console.log("handle server error")
		console.log(err)
		handleServerError && handleServerError()
	})
}

export const ServerAPI_GET = ({ url, urlParams, body, onDataReceived, handleStatus, handleServerError, headers }) => {
	ServerAPI({
		method : 'GET',
		url : url,
		urlParams : urlParams,
		body : body,
		onDataReceived : onDataReceived,
		handleStatus : handleStatus,
		handleServerError : handleServerError,
		headers : headers
	})
}

export const ServerAPI_POST = ({ url, urlParams, body, onDataReceived, handleStatus, handleServerError, headers }) => {
	ServerAPI({
		method : 'POST',
		url : url,
		urlParams : urlParams,
		body : body,
		onDataReceived : onDataReceived,
		handleStatus : handleStatus,
		handleServerError : handleServerError,
		headers : headers || { 'Content-Type': 'application/json; charset=UTF-8' }
	})
}

export const ServerAPI_PATCH = ({ url, urlParams, body, onDataReceived, handleStatus, handleServerError, headers }) => {
	ServerAPI({
		method : 'PATCH',
		url : url,
		urlParams : urlParams,
		body : body,
		onDataReceived : onDataReceived,
		handleStatus : handleStatus,
		handleServerError : handleServerError,
		headers : headers || { 'Content-Type': 'application/json; charset=UTF-8' }
	})
}

export const ServerAPI_DELETE = ({ url, urlParams, body, onDataReceived, handleStatus, handleServerError, headers }) => {
	ServerAPI({
		method : 'DELETE',
		url : url,
		urlParams : urlParams,
		body : body,
		onDataReceived : onDataReceived,
		handleStatus : handleStatus,
		handleServerError : handleServerError,
		headers : headers
	})
}
