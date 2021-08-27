// search for csrf token in meta tags.
const metaTags = [].slice.call(document.getElementsByTagName("meta"))
const csrfTokenTag = metaTags.find(
  (tag) => tag.getAttribute("name") == "csrf-token"
)
const csrfToken = csrfTokenTag && csrfTokenTag.getAttribute("content")

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

export const post = (url, params = {}) =>
  fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "x-csrf-token": csrfToken,
    },
    body: JSON.stringify(params),
  })
    .then(checkStatus)
    .then((response) => response.json())

export const del = (url) =>
  fetch(url, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "x-csrf-token": csrfToken,
    },
  }).then(checkStatus)

export const put = (url, params = {}) =>
  fetch(url, {
    method: "PUT",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "x-csrf-token": csrfToken,
    },
    body: JSON.stringify(params),
  })
    .then(checkStatus)
    .then((response) => response.json())
