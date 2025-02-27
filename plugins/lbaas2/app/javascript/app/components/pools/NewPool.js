import React, { useState, useEffect } from "react"
import { Modal, Button, Collapse } from "react-bootstrap"
import useCommons from "../../../lib/hooks/useCommons"
import { Form } from "lib/elektra-form"
import usePool from "../../../lib/hooks/usePool"
import SelectInput from "../shared/SelectInput"
import HelpPopover from "../shared/HelpPopover"
import useListener from "../../../lib/hooks/useListener"
import TagsInput from "../shared/TagsInput"
import { addNotice } from "lib/flashes"
import useLoadbalancer from "../../../lib/hooks/useLoadbalancer"
import Log from "../shared/logger"

const NewPool = (props) => {
  const {
    searchParamsToString,
    queryStringSearchValues,
    matchParams,
    formErrorMessage,
    helpBlockTextForSelect,
  } = useCommons()
  const {
    lbAlgorithmTypes,
    poolPersistenceTypes,
    protocolTypes,
    createPool,
    filterListeners,
  } = usePool()
  const { fetchListnersNoDefaultPoolForSelect, fetchSecretsForSelect } =
    useListener()
  const { persistLoadbalancer } = useLoadbalancer()
  const [availableListeners, setAvailableListeners] = useState([])
  const [listenersLoading, setListenersLoading] = useState(true)
  const [listeners, setListeners] = useState({
    isLoading: false,
    error: null,
    items: [],
  })
  const [secrets, setSecrets] = useState({
    isLoading: false,
    error: null,
    items: [],
  })

  useEffect(() => {
    Log.debug("fetching listeners for select")
    const params = matchParams(props)
    const lbID = params.loadbalancerID
    // get listeners for the select
    setListeners({ ...listeners, isLoading: true })
    fetchListnersNoDefaultPoolForSelect(lbID)
      .then((data) => {
        setListeners({
          ...listeners,
          isLoading: false,
          items: data.listeners,
          error: null,
        })
        setListenersLoading(false)
      })
      .catch((error) => {
        setListeners({ ...listeners, isLoading: false, error: error })
      })

    // get the containers for the select
    setSecrets({ ...secrets, isLoading: true })
    fetchSecretsForSelect(lbID)
      .then((data) => {
        setSecrets({
          ...secrets,
          isLoading: false,
          items: data.secrets,
          error: null,
        })
      })
      .catch((error) => {
        setSecrets({ ...secrets, isLoading: false, error: error })
      })
  }, [])

  useEffect(() => {
    if (!listenersLoading) {
      const selectedProtocol = protocol ? protocol.value : ""
      setAvailableListeners(filterListeners(listeners.items, selectedProtocol))
    }
  }, [listenersLoading])

  /**
   * Modal stuff
   */
  const [show, setShow] = useState(true)

  const close = (e) => {
    if (e) e.stopPropagation()
    setShow(false)
  }

  const restoreUrl = () => {
    if (!show) {
      const params = matchParams(props)
      const lbID = params.loadbalancerID
      props.history.replace(
        `/loadbalancers/${lbID}/show?${searchParamsToString(props)}`
      )
    }
  }

  /**
   * Form stuff
   */

  const [formErrors, setFormErrors] = useState(null)
  const [initialValues, setInitialValues] = useState()

  const [protocol, setProtocol] = useState(null)
  const [sessionPersistenceType, setSessionPersistenceType] = useState(null)
  const [listener, setListener] = useState(null)

  const [showTLSSettings, setShowTLSSettings] = useState(false)
  const [showCookieName, setShowCookieName] = useState(false)

  const validate = ({
    name,
    description,
    lb_algorithm,
    protocol,
    session_persistence_type,
    session_persistence_cookie_name,
    listener_id,
    tls_enabled,
    tls_container_ref,
    ca_tls_container_ref,
    tags,
  }) => {
    return name && lb_algorithm && protocol && true
  }

  const onSubmit = (values) => {
    setFormErrors(null)

    const newValues = { ...values }
    if (!listener) {
      // remove just in case protocol changes and the listener list ist rerendered without choosing again a listener
      delete newValues.listener_id
    }
    if (
      sessionPersistenceType &&
      sessionPersistenceType.value != "APP_COOKIE"
    ) {
      // remove just in case it still in context but presistence is not anymore app_coockie
      delete newValues.session_persistence_cookie_name
    }
    if (!showTLSSettings) {
      // remove tls attributes just in case they still in context but tls not anymore enabled
      delete newValues.tls_container_ref
      delete newValues.ca_tls_container_ref
    }

    // get the lb id
    const params = matchParams(props)
    const lbID = params.loadbalancerID
    return createPool(lbID, newValues)
      .then((response) => {
        addNotice(
          <React.Fragment>
            Pool <b>{response.data.name}</b> ({response.data.id}) is being
            created.
          </React.Fragment>
        )
        // fetch the lb again containing the new listener so it gets updated fast
        persistLoadbalancer(lbID).catch((error) => {})
        close()
      })
      .catch((error) => {
        setFormErrors(formErrorMessage(error))
      })
  }

  const onProtocolChanged = (props) => {
    setProtocol(props)
    setListener(null)
    setAvailableListeners(filterListeners(listeners.items, props.value))
  }

  const onPoolPersistenceTypeChanged = (option) => {
    setSessionPersistenceType(option)
    setShowCookieName(option && option.value == "APP_COOKIE")
  }
  const onSelectListenerChange = (props) => {
    setListener(props)
  }
  const onChangedTLS = (e) => {
    if (e && e.target) {
      const value = e.target.checked
      setTimeout(() => setShowTLSSettings(value), 200)
    }
  }

  const protocolTypesFiltered = () => {
    // do not show types disabled
    return protocolTypes().filter((t) => !t.state?.includes("disabled"))
  }

  Log.debug("RENDER new pool")
  return (
    <Modal
      show={show}
      onHide={close}
      bsSize="large"
      backdrop="static"
      onExited={restoreUrl}
      aria-labelledby="contained-modal-title-lg"
      bsClass="lbaas2 modal"
    >
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-lg">New Pool</Modal.Title>
      </Modal.Header>

      <Form
        className="form form-horizontal"
        validate={validate}
        onSubmit={onSubmit}
        initialValues={initialValues}
        resetForm={false}
      >
        <Modal.Body>
          <div className="bs-callout bs-callout-warning bs-callout-emphasize">
            <h4>
              Switched to using PKCS12 for TLS Term certs (New in API version
              2.8)
            </h4>
            <p>
              For pools with TLS encryption now use the URI of the Key Manager
              service secret containing a PKCS12 format certificate/key bundle.
            </p>
            <p>
              Please see following examples for creating certs with PKCS12
              format:{" "}
              <a
                href="https://github.com/openstack/octavia/blob/master/doc/source/user/guides/basic-cookbook.rst"
                target="_blank"
              >
                Basic Load Balancing Cookbook
              </a>
            </p>
          </div>
          <p>
            Object representing the grouping of members to which the listener
            forwards client requests. Note that a pool is associated with only
            one listener, but a listener might refer to several pools (and
            switch between them using layer 7 policies).
          </p>
          <Form.Errors errors={formErrors} />

          <Form.ElementHorizontal label="Name" name="name" required>
            <Form.Input elementType="input" type="text" name="name" />
          </Form.ElementHorizontal>

          <Form.ElementHorizontal label="Description" name="description">
            <Form.Input elementType="input" type="text" name="description" />
          </Form.ElementHorizontal>

          <Form.ElementHorizontal
            label="Lb Algorithm"
            name="lb_algorithm"
            required
          >
            <SelectInput name="lb_algorithm" items={lbAlgorithmTypes()} />
            <span className="help-block">
              <i className="fa fa-info-circle"></i>
              The method used for lbaas between members.
            </span>
          </Form.ElementHorizontal>

          <Form.ElementHorizontal label="Protocol" name="protocol" required>
            <SelectInput
              name="protocol"
              items={protocolTypesFiltered()}
              onChange={onProtocolChanged}
              value={protocol}
            />
            <span className="help-block">
              <i className="fa fa-info-circle"></i>
              The protocol used for routing the traffic to the members.
            </span>
          </Form.ElementHorizontal>

          <Form.ElementHorizontal
            label="Session Persistence Type"
            name="session_persistence_type"
          >
            <SelectInput
              name="session_persistence_type"
              isClearable
              items={poolPersistenceTypes()}
              onChange={onPoolPersistenceTypeChanged}
              value={sessionPersistenceType}
            />
            <span className="help-block">
              <i className="fa fa-info-circle"></i>
              <span className="help-block-text">
                Defines the method used for session stickiness. Traffic for a
                client will be send always to the same member after the session
                is established.
              </span>
              <HelpPopover
                text={helpBlockTextForSelect(poolPersistenceTypes())}
              />
            </span>
          </Form.ElementHorizontal>

          <Collapse in={showCookieName}>
            <div className="advanced-options-section">
              <div className="advanced-options">
                <Form.ElementHorizontal
                  label="Cookie Name"
                  name="session_persistence_cookie_name"
                  required
                >
                  <Form.Input
                    elementType="input"
                    type="text"
                    name="session_persistence_cookie_name"
                  />
                  <span className="help-block">
                    <i className="fa fa-info-circle"></i>
                    The name of the HTTP cookie defined by your application. The
                    cookie value will be used for session stickiness.
                  </span>
                </Form.ElementHorizontal>
              </div>
            </div>
          </Collapse>

          <Form.ElementHorizontal
            label="Default Pool for Listener"
            name="listener_id"
          >
            {/* dont remove useFromContext because of validation of protocol when changing the listener */}
            <SelectInput
              name="listener_id"
              isClearable
              isLoading={listeners.isLoading}
              items={availableListeners}
              onChange={onSelectListenerChange}
              conditionalPlaceholderText="Please choose the protocol first"
              conditionalPlaceholderCondition={protocol == null}
              value={listener}
            />
            {listeners.error ? (
              <span className="text-danger">{listeners.error}</span>
            ) : (
              ""
            )}
            <span className="help-block">
              <i className="fa fa-info-circle"></i>
              The listener for which this pool is set as the default one.
            </span>
          </Form.ElementHorizontal>

          <Form.ElementHorizontal label="Use TLS" name="tls_enabled">
            <Form.Input
              elementType="input"
              type="checkbox"
              name="tls_enabled"
              onClick={onChangedTLS}
            />
            <span className="help-block">
              <i className="fa fa-info-circle"></i>
              When true connections to backend member servers will use TLS
              encryption
            </span>
          </Form.ElementHorizontal>

          <Collapse in={showTLSSettings}>
            <div className="advanced-options-section">
              <div className="advanced-options">
                <div className="row">
                  <div className="col-sm-8 col-sm-push-4">
                    <div className="bs-callout bs-callout-warning bs-callout-emphasize">
                      <p>
                        {" "}
                        TLS-enabled pool can only be attached to a{" "}
                        <b>TERMINATED_HTTPS</b> type listener!
                      </p>
                    </div>
                  </div>
                </div>
                <Form.ElementHorizontal
                  label="Certificate Secret"
                  name="tls_container_ref"
                >
                  <SelectInput
                    name="tls_container_ref"
                    isClearable
                    isLoading={secrets.isLoading}
                    items={secrets.items}
                  />
                  <span className="help-block">
                    <i className="fa fa-info-circle"></i>
                    The reference to the secret containing a PKCS12 format
                    certificate/key bundle for TLS client authentication to the
                    member servers.
                  </span>
                  {secrets.error && (
                    <span className="text-danger">{secrets.error}</span>
                  )}
                </Form.ElementHorizontal>

                <Form.ElementHorizontal
                  label="Authentication Secret (CA)"
                  name="ca_tls_container_ref"
                >
                  <SelectInput
                    name="ca_tls_container_ref"
                    isClearable
                    isLoading={secrets.isLoading}
                    items={secrets.items}
                  />
                  <span className="help-block">
                    <i className="fa fa-info-circle"></i>
                    The reference secret containing a PEM format CA certificate
                    bundle.
                  </span>
                  {secrets.error && (
                    <span className="text-danger">{secrets.error}</span>
                  )}
                </Form.ElementHorizontal>
              </div>
            </div>
          </Collapse>

          <Form.ElementHorizontal label="Tags" name="tags">
            <TagsInput name="tags" />
            <span className="help-block">
              <i className="fa fa-info-circle"></i>
              Start a new tag typing a string and hitting the Enter or Tab key.
            </span>
          </Form.ElementHorizontal>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={close}>Cancel</Button>
          <Form.SubmitButton label="Save" />
        </Modal.Footer>
      </Form>
    </Modal>
  )
}

export default NewPool
