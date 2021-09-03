import React from "react"
import { useParams, useHistory, Link, useRouteMatch } from "react-router-dom"
import * as apiClient from "../../lib/apiClient"
import ObjectItem from "./item"

import Router from "./router"
import Breadcrumb from "./breadcrumb"
import useUrlParamEncoder from "../../lib/useUrlParamEncoder"

const Objects = () => {
  let { url } = useRouteMatch()
  let { name, objectPath } = useParams()
  const { value: currentPath } = useUrlParamEncoder(objectPath)

  const [isFetching, setIsFetching] = React.useState()
  const [error, setError] = React.useState()
  const [objects, setObjects] = React.useState()

  React.useEffect(() => {
    setIsFetching(true)
    apiClient
      .get(`containers/${name}/objects`)
      .then((objects) => setObjects(objects))
      .catch((error) => {
        setError(error.message)
      })
      .finally(() => setIsFetching(false))

    return () => setObjects(null)
  }, [name])

  const items = React.useMemo(() => {
    if (!objects || objects.length === 0) return []

    const folders = {}
    const items = []
    objects
      .filter((o) => currentPath === "new" || o.name.startsWith(currentPath))
      .forEach((o) => {
        const rest = o.name.replace(currentPath, "")
        const index = rest.indexOf("/")
        if (index >= 0) {
          const name = rest.slice(0, index + 1)
          console.log(name)
          folders[name] = folders[name] || {
            name,
            path: currentPath,
            bytes: 0,
            updatedAt: null,
            folder: true,
          }
          folders[name].bytes += o.bytes
          folders[name].updatedAt = folders[name].updatedAt || o.last_modified
        } else {
          items.push({
            ...o,
            path: currentPath,
            name: rest,
            updatedAt: o.last_modified,
          })
        }
      })

    return Object.values(folders).concat(items)
  }, [objects, currentPath])

  return (
    <React.Fragment>
      <Router />
      <Breadcrumb />

      <div className="toolbar">
        <div className="main-buttons">
          <Link className="btn btn-default" to={`${url}/new`}>
            Create folder
          </Link>
          <Link className="btn btn-primary" to={`${url}/upload`}>
            Upload file
          </Link>
        </div>
      </div>

      {isFetching ? (
        <span>
          <span className="spinner" /> Loading...
        </span>
      ) : error ? (
        <Alert bsStyle="danger">{error}</Alert>
      ) : !objects || objects.length === 0 ? (
        <span>No entries found.</span>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Object name</th>
              <th>Size</th>
              <th>Last Modified</th>
              <th className="snug"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <ObjectItem item={item} key={i} />
            ))}
          </tbody>
        </table>
      )}
    </React.Fragment>
  )
}

export default Objects
