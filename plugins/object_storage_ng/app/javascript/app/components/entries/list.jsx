import React from "react"
import { useParams, Link } from "react-router-dom"
import * as apiClient from "../../lib/apiClient"

const Entries = () => {
  const { name } = useParams()
  const [isFetching, setIsFetching] = React.useState()
  const [error, setError] = React.useState()
  const [objects, setObjects] = React.useState()
  const [path, setPath] = React.useState("")

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
    console.log("=====path", path)

    const folders = {}
    const items = []
    objects
      .filter((o) => o.name.startsWith(path))
      .forEach((o) => {
        const rest = o.name.replace(path, "")
        const index = rest.indexOf("/")
        if (index >= 0) {
          const name = rest.slice(0, index + 1)
          console.log(name)
          folders[name] = folders[name] || {
            name,
            path,
            size: 0,
            updatedAt: null,
            folder: true,
          }
          folders[name].size += o.bytes
        } else {
          items.push({ ...o, path, name: rest })
        }
      })
    console.log("============folders", folders)
    console.log("============items", items)
    return Object.values(folders).concat(items)
  }, [objects, path])

  const breadcrumb = React.useMemo(
    () => path.split("/").filter((p) => !!p && p !== ""),
    [path]
  )

  return (
    <React.Fragment>
      <ol className="breadcrumb">
        <li>
          <Link to="/containers">All containers</Link>
        </li>
        <li>
          {breadcrumb.length === 0 ? (
            name
          ) : (
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault()
                setPath("")
              }}
            >
              {name}
            </a>
          )}
        </li>

        {breadcrumb.map((p, i) => (
          <li className="active" key={i}>
            {i < breadcrumb.length - 1 ? (
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  let newPath = breadcrumb.slice(0, i).join("/")
                  if (newPath.length > 0) newPath += "/"
                  setPath(newPath)
                }}
              >
                {p}
              </a>
            ) : (
              p
            )}
          </li>
        ))}
      </ol>

      {isFetching ? (
        <span>
          <span className="spinner" /> Loading...
        </span>
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
              <tr key={i}>
                <td>
                  {item.folder ? (
                    <span
                      className="fa fa-fw fa-folder-open"
                      title="Directory"
                    />
                  ) : item.content_type &&
                    item.content_type.startsWith("text/") ? (
                    <span className="fa fa-fw fa-file-text-o" title="Object" />
                  ) : (
                    <span className="fa fa-fw fa-file-o" title="Object" />
                  )}{" "}
                  {item.folder ? (
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        setPath(item.path + item.name)
                      }}
                    >
                      {item.name}
                    </a>
                  ) : (
                    item.name
                  )}
                </td>
                <td>{item.size}</td>
                <td>{item.path}</td>
                <td></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </React.Fragment>
  )
}

export default Entries
