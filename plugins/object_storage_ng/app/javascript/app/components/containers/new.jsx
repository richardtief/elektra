import { Modal, Button } from "react-bootstrap"
import { Form } from "lib/elektra-form"
import { useHistory } from "react-router-dom"

const NewContainer = () => {
  const history = useHistory()
  const [show, setShow] = React.useState(true)

  const validate = React.useCallback((values) => !!values.name, [])

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
      bsSize="large"
      aria-labelledby="contained-modal-title-lg"
      dialogClassName="modal-xl"
    >
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-lg">New Entry</Modal.Title>
      </Modal.Header>

      <Form className="form" validate={validate} onSubmit={() => null}>
        <Modal.Body>
          <Form.Errors />

          <div className="row">
            <div className="col-md-6">
              <Form.Element label="Container name" name="name" inline required>
                <Form.Input elementType="input" type="text" name="name" />
              </Form.Element>
            </div>
            <div className="col-md-6">
              <div className="bs-callout bs-callout-info">
                <p>
                  Inside a project, objects are stored in containers. Containers
                  are where you define access permissions and quotas.
                </p>
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={close}>Cancel</Button>
          <Form.SubmitButton label="Save" />
        </Modal.Footer>
      </Form>
    </Modal>
  )
}

export default NewContainer
