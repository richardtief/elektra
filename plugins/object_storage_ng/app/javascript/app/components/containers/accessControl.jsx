import React from "react"
import { Modal, Button, Alert } from "react-bootstrap"
import { useHistory, useParams } from "react-router-dom"
import { useGlobalState, useDispatch } from "../../stateProvider"
import * as apiClient from "../../lib/apiClient"

const ContainerAccessControl = ({}) => {
  const { name } = useParams()
  const history = useHistory()
  const [show, setShow] = React.useState(!!name)
  const containers = useGlobalState("containers")

  const container = React.useMemo(() => {
    if (!containers?.items) return
    return containers.items.find((c) => c.name === name)
  }, [containers, name])

  const close = React.useCallback((e) => {
    setShow(false)
  }, [])

  const back = React.useCallback((e) => {
    history.replace("/containers")
  }, [])

  return (
    <Modal
      show={show}
      onHide={close}
      onExit={back}
      bsSize="lg"
      aria-labelledby="contained-modal-title-lg"
    >
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-lg">
          Access Control for container: {container?.name}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {containers.isFetching ? (
          <span>
            <span className="spinner" />
            Loading...
          </span>
        ) : !container ? (
          <span>Container not found!</span>
        ) : (
          <React.Fragment>Access Control</React.Fragment>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={close}>Cancel</Button>
      </Modal.Footer>
    </Modal>
  )
}

export default ContainerAccessControl
