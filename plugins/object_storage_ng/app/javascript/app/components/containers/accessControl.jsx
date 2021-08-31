import React from "react"
import { Modal, Button, Alert } from "react-bootstrap"
import { useHistory, useParams } from "react-router-dom"
import { useGlobalState, useDispatch } from "../../stateProvider"
import * as apiClient from "../../lib/apiClient"

import { createUseStyles } from "react-jss"

const useStyles = createUseStyles({
  infoCallout: {
    marginBottom: 10,
  },
  dd: {
    marginLeft: "2rem",
  },
  dt: {
    marginTop: 10,
  },
})

const ContainerAccessControl = ({}) => {
  const classes = useStyles()
  const { name } = useParams()
  const history = useHistory()
  const [show, setShow] = React.useState(!!name)
  const [error, setError] = React.useState()
  const { containers, capabilities } = useGlobalState()

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
        ) : error ? (
          <Alert bsStyle="danger">{error}</Alert>
        ) : (
          <React.Fragment>
            <div className="row">
              <div className="col-md-6">
                <div className="loading-place loading-right">
                  {capabilities.data?.staticweb ? (
                    <React.Fragment>
                      <span>if</span>
                      {/* // = f.input :read_acl, 
        //     as: :text, 
        //     label: "Read ACLs", 
        //     input_html: {:rows => 4},
        //     readonly: @container.public_read_access?
        // %p
        //   = f.input :public_read_access?, as: :boolean, label: 'Public Read Access' */}
                    </React.Fragment>
                  ) : (
                    <React.Fragment>
                      <span>else</span>
                      {/* //   = f.input :read_acl, 
      //     as: :text, 
      //     label: 'Read ACLs',
      //     input_html: {:rows => 4}
      // = f.input :write_acl, 
      //     as: :text,
      //     label: "Write ACLs",
      //     input_html: {:rows => 4}
      // = link_to 'Check ACLs' , '#', class: 'btn btn-default pull-right', id: 'check_acls'  */}
                    </React.Fragment>
                  )}
                </div>
              </div>
              <div className="col-md-6">
                <div
                  className={`bs-callout bs-callout-info ${classes.infoCallout}`}
                >
                  <p>Entries in ACLs are comma-separated. Examples:</p>
                  <dl>
                    <dt className={classes.dt}>
                      <code>.r:*</code>
                    </dt>
                    <dd className={classes.dd}>
                      Any user has read access to objects. No token is required
                      in the request.
                    </dd>
                    <dt className={classes.dt}>
                      <code>.rlistings</code>
                    </dt>
                    <dd className={classes.dd}>
                      Any user can perform a HEAD or GET operation on the
                      container provided the user also has read access on
                      objects. No token is required.
                    </dd>
                    <dt className={classes.dt}>
                      <code>PROJECT_ID:USER_ID</code>
                    </dt>
                    <dd className={classes.dd}>
                      Grant access to a user from a different project.
                    </dd>
                    <dt className={classes.dt}>
                      <code>PROJECT_ID:*</code>
                    </dt>
                    <dd className={classes.dd}>
                      Grant access to all users from that project.
                    </dd>
                    <dt className={classes.dt}>
                      <code>*:USER_ID</code>
                    </dt>
                    <dd className={classes.dd}>
                      The specified user has access. A token for the user
                      (scoped to any project) must be included in the request.
                    </dd>
                  </dl>
                  <p>
                    For more details, have a look at the{" "}
                    <a
                      href="https://docs.openstack.org/swift/latest/overview_acl.html#container-acls"
                      target="_blank"
                    >
                      documentation
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </React.Fragment>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={close}>Cancel</Button>
      </Modal.Footer>
    </Modal>
  )
}

export default ContainerAccessControl
