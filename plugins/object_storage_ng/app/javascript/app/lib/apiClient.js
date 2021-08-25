// Check response status
const checkStatus = (response) => {
  if (response.status >= 200 && response.status < 300) {
    return response
  } else {
    var error = new Error(response.statusText || response.status)
    error.response = response
    throw error
  }
}

export const get = (url, params = {}) =>
  fetch(url, params)
    .then(checkStatus)
    .then((response) => response.json())
