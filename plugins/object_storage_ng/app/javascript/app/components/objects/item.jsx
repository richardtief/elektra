import { Unit } from "lib/unit"
import React from "react"
import { Dropdown, MenuItem } from "react-bootstrap"
import { useRouteMatch, useHistory, useParams } from "react-router-dom"
import useUrlParamEncoder from "../../lib/useUrlParamEncoder"
import * as apiClient from "../../lib/apiClient"

const unit = new Unit("B")

const ObjectItem = ({ item }) => {
  let { url } = useRouteMatch()
  let { encode } = useUrlParamEncoder()
  const { name } = useParams()
  let history = useHistory()
  let objectsRoot = url.replace(/([^\/])\/objects.*/, "$1/objects")
  const [isProcessing, setIsProcessing] = React.useState()
  const [error, setError] = React.useState()

  const handleSelect = React.useCallback(
    (e) => {
      console.log("==========================handleSelect", e)
      switch (e) {
        case "1":
          return history.push(`/containers/${name}/properties`)
        case "2":
          return history.push(`/containers/${name}/access-control`)
        case "3":
          return history.push(`/containers/${name}/empty`)
        case "4":
          return history.push(`/containers/${name}/delete`)
        case "5":
          setIsProcessing("Deleting")
          setError(null)
          apiClient
            .del(`containers/${name}/objects`, { path: item.path + item.name })
            .then(() => {
              console.log("==================REMOVE ITEM")
            })
            .catch((error) => setError(error.message))
            .finally(() => setIsProcessing(null))
          return
        default:
          return
      }
    },
    [name, history]
  )

  const downloadUrl = React.useMemo(
    () => `containers/${name}/objects/download?path=${item.path + item.name}`,
    [name, item]
  )

  return (
    <tr>
      <td>
        {item.folder ? (
          <span className="fa fa-fw fa-folder-open" title="Directory" />
        ) : item.content_type && item.content_type.startsWith("text/") ? (
          <span className="fa fa-fw fa-file-text-o" title="Object" />
        ) : (
          <span className="fa fa-fw fa-file-o" title="Object" />
        )}{" "}
        {item.folder ? (
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault()
              history.push(`${objectsRoot}/${encode(item.path + item.name)}`)
            }}
          >
            {item.name}
          </a>
        ) : (
          <a href={downloadUrl}>{item.name}</a>
        )}
      </td>
      <td>{unit.format(item.bytes)}</td>
      <td>
        {isProcessing ? (
          <span>
            <span className="spinner" />
            {isProcessing}
          </span>
        ) : error ? (
          <span className="text-danger">{error}</span>
        ) : (
          item.updatedAt
        )}
      </td>
      <td className="snug">
        <Dropdown
          id={`object-dropdown-${item.path}-${item.name}`}
          pullRight
          onSelect={handleSelect}
        >
          <Dropdown.Toggle noCaret className="btn-sm">
            <span className="fa fa-cog" />
          </Dropdown.Toggle>

          {item.folder ? (
            <Dropdown.Menu>
              <MenuItem eventKey="1">Delete recursively</MenuItem>
            </Dropdown.Menu>
          ) : (
            <Dropdown.Menu className="super-colors">
              <MenuItem href={downloadUrl}>Download</MenuItem>

              <MenuItem divider />
              <MenuItem eventKey="2">Properties</MenuItem>
              <MenuItem divider />

              <MenuItem eventKey="3">Copy</MenuItem>
              <MenuItem eventKey="4">Move/Rename</MenuItem>
              <MenuItem eventKey="5">Delete</MenuItem>
              <MenuItem eventKey="6">Delete (keep segments)</MenuItem>
            </Dropdown.Menu>
          )}
        </Dropdown>
      </td>
    </tr>
  )
}

export default ObjectItem
