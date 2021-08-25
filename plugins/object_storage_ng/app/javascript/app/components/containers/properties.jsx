import { Modal, Button } from "react-bootstrap"
import { Form } from "lib/elektra-form"
import { useHistory, useParams } from "react-router-dom"
import { useGlobalState } from "../../stateProvider"
import React from "react"
import { Unit } from "lib/unit"
const unit = new Unit("B")

const ContainerProperties = ({}) => {
  const { name } = useParams()
  const history = useHistory()
  const [show, setShow] = React.useState(!!name)
  const { containers, capabilities } = useGlobalState()

  const container = React.useMemo(() => {
    if (!containers?.items) return
    return containers.items.find((c) => c.name === name)
  }, [containers])

  const close = React.useCallback((e) => {
    setShow(false)
    //   setTimeout(() => this.props.history.replace('/entries'), 300)
  }, [])

  const back = React.useCallback((e) => {
    history.replace("/containers")
  }, [])

  const initialValues = React.useMemo(() => {
    if (!container) return {}
    return { ...container, total_size: unit.format(container.bytes_used) }
  }, [container])

  return (
    <Modal
      show={show}
      onHide={close}
      onExit={back}
      bsSize="lg"
      dialogClassName="modal-xl"
      aria-labelledby="contained-modal-title-lg"
    >
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-lg">
          Container: {container?.name}
        </Modal.Title>
      </Modal.Header>

      <Form
        onSubmit={(e) => null}
        className="form"
        validate={(values) => true}
        initialValues={initialValues}
      >
        <Modal.Body>
          {containers.isFetching ? (
            <span>
              <span className="spinner" />
              Loading...
            </span>
          ) : !container ? (
            <span>Container not found!</span>
          ) : (
            <React.Fragment>
              {JSON.stringify(container, null, 2)}
              <div className="row">
                <div className="col-md-6">
                  <Form.Element label="Object count" name="object_count" inline>
                    <Form.Input
                      disabled
                      elementType="input"
                      type="text"
                      name="object_count"
                    />
                  </Form.Element>
                  <Form.Element label="Total size" name="total_size" inline>
                    <Form.Input
                      disabled
                      elementType="input"
                      type="text"
                      name="total_size"
                    />
                  </Form.Element>
                </div>
                <div className="col-md-6">
                  <Form.Element
                    label="Object count quota"
                    name="object_count_quota"
                    inline
                  >
                    <Form.Input
                      placeholder="Leave empty to disable"
                      elementType="input"
                      type="number"
                      name="object_count_quota"
                    />
                  </Form.Element>
                  <Form.Element
                    label="Total size quota"
                    name="bytes_quota"
                    inline
                  >
                    <Form.Input
                      placeholder="Leave empty to disable"
                      elementType="input"
                      type="text"
                      name="bytes_quota"
                    />
                  </Form.Element>
                </div>
              </div>
              {container.allows_public_access && (
                <span>
                  URL for public access{" "}
                  <a href={container.public_url} target="_blank">
                    {container.public_url}
                  </a>
                </span>
              )}
            </React.Fragment>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={close}>Cancel</Button>
          {container && <Form.SubmitButton label="Save" />}
        </Modal.Footer>
      </Form>
    </Modal>
  )
}

export default ContainerProperties
