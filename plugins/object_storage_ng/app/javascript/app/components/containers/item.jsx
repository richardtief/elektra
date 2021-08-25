import { MenuItem, Dropdown } from "react-bootstrap"
import { useHistory } from "react-router-dom"
import { Unit } from "lib/unit"
const unit = new Unit("B")

const Container = ({
  container,
  canViewAccessControl,
  canDelete,
  canShow,
  canEmpty,
}) => {
  const history = useHistory()
  const handleSelect = React.useCallback((e) => {
    switch (e) {
      case "1":
        return history.push(`/containers/${container.name}/properties`)
      case "2":
        return history.push(`/containers/${container.name}/access-control`)
      case "3":
      //history.push(`/containers/${container.name}/properties`)
      case "4":
      //history.push(`/containers/${container.name}/properties`)
      default:
        return
    }
  }, [])

  return (
    <tr>
      <td className="name-with-icon">
        <span className="fa fa-fw fa-hdd-o" title="Container" />{" "}
        <a href="#" onClick={(e) => e.preventDefault()} title="List Containers">
          {container.name}
        </a>
      </td>
      <td>{unit.format(container.bytes_used)}</td>
      <td>{container.object_count}</td>
      <td className="snug">
        <Dropdown
          id={`container-dropdown-${container.name}`}
          pullRight
          onSelect={handleSelect}
        >
          <Dropdown.Toggle noCaret className="btn-sm">
            <span className="fa fa-cog" />
          </Dropdown.Toggle>
          <Dropdown.Menu className="super-colors">
            {canShow && <MenuItem eventKey="1">Properties</MenuItem>}
            {canViewAccessControl && (
              <MenuItem eventKey="2">Access Control</MenuItem>
            )}
            {(canShow || canViewAccessControl) && <MenuItem divider />}
            {canEmpty && <MenuItem eventKey="3">Empty</MenuItem>}
            {canDelete && <MenuItem eventKey="4">Delete</MenuItem>}
          </Dropdown.Menu>
        </Dropdown>
      </td>
    </tr>
  )
}
export default Container
