import { Link } from "react-router-dom"
import { policy } from "policy"
import { SearchField } from "lib/components/search_field"
import Container from "./item"
import React from "react"
import CapabilitiesPopover from "../capabilities/popover"
import { useGlobalState, useDispatch } from "../../stateProvider"
import * as apiClient from "../../lib/apiClient"

const EntryList = ({}) => {
  // TODO: remove
  const state = useGlobalState()
  const [showState, setShowState] = React.useState(false)
  // ----

  const [searchTerm, setSearchTerm] = React.useState()
  const containers = useGlobalState("containers")
  const dispatch = useDispatch()

  // policy rules do not require container
  // so we can do the checks for all items at once
  const policyRules = React.useMemo(() => {
    if (!policy) return {}
    return {
      canDelete: policy.isAllowed("object_storage_ng:container_delete"),
      canEmpty: policy.isAllowed("object_storage_ng:container_empty"),
      canShow: policy.isAllowed("object_storage_ng:container_get"),
      canViewAccessControl: policy.isAllowed(
        "object_storage_ng:container_show_access_control"
      ),
    }
  }, [policy])

  React.useEffect(() => {
    if (!policy.isAllowed("object_storage_ng:container_list")) return

    dispatch({ type: "REQUEST_CONTAINERS" })
    apiClient
      .get("containers")
      .then((items) => dispatch({ type: "RECEIVE_CONTAINERS", items }))
      .catch((error) =>
        dispatch({ type: "RECEIVE_CONTAINERS_ERROR", error: error.message })
      )
  }, [])

  const items = React.useMemo(() => {
    if (!containers.items) return []
    if (!searchTerm) return containers.items
    return containers.items.filter((i) => i.name.includes(searchTerm))
  }, [containers.items, searchTerm])

  return (
    <React.Fragment>
      {/*TODO: remove */}
      <button
        onClick={(e) => {
          e.preventDefault()
          setShowState(!showState)
        }}
      >
        state
      </button>
      <div className={`collapse ${showState ? "in" : ""}`} id="collapseExample">
        State: <pre>{JSON.stringify(state, null, 2)}</pre>
      </div>
      {/* --------------*/}

      <div className="toolbar">
        <SearchField
          onChange={(term) => setSearchTerm(term)}
          placeholder="name"
          text="Filters by name"
        />

        <div className="main-buttons">
          {policy.isAllowed("object_storage_ng:container_create") && (
            <React.Fragment>
              <CapabilitiesPopover />

              <Link to="/containers/new" className="btn btn-primary">
                Create new
              </Link>
            </React.Fragment>
          )}
        </div>
      </div>
      {!policy.isAllowed("object_storage_ng:container_list") ? (
        <span>You are not allowed to see this page</span>
      ) : containers.isFetching ? (
        <span>
          <span className="spinner" />
          Loading...
        </span>
      ) : items.length === 0 ? (
        <span>No Containers found.</span>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Container name</th>
              <th>Total size</th>
              <th>Object count</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <Container key={index} container={item} {...policyRules} />
            ))}
          </tbody>
        </table>
      )}
    </React.Fragment>
  )
}

export default EntryList
