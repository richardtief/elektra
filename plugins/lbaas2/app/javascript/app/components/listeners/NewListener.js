import React, { useState, useEffect } from "react"
import useCommons from "../../../lib/hooks/useCommons"
import { Modal, Button, Collapse } from "react-bootstrap"
import { Form } from "lib/elektra-form"
import useListener from "../../../lib/hooks/useListener"
import SelectInput from "../shared/SelectInput"
import TagsInput from "../shared/TagsInput"
import HelpPopover from "../shared/HelpPopover"
import useLoadbalancer from "../../../lib/hooks/useLoadbalancer"
import { addNotice } from "lib/flashes"
import Log from "../shared/logger"

const NewListener = (props) => {
  const {
    searchParamsToString,
    matchParams,
    fetchPoolsForSelect,
    formErrorMessage,
    helpBlockTextForSelect,
    errorMessage,
  } = useCommons()
  const {
    protocolTypes,
    tlsPoolRelation,
    protocolHeaderInsertionRelation,
    clientAuthenticationRelation,
    fetchSecretsForSelect,
    certificateContainerRelation,
    SNIContainerRelation,
    CATLSContainerRelation,
    createListener,
    advancedSectionRelation,
    predefinedPolicies,
    httpHeaderInsertions,
    helpBlockItems,
  } = useListener()
  const { persistLoadbalancer } = useLoadbalancer()
  const [pools, setPools] = useState({
    isLoading: false,
    error: null,
    items: [],
  })
  const [nonSelectableTlsPools, setNonSelectableTlsPools] = useState([])
  const [displayPools, setDisplayPools] = useState([])
  const [secrets, setSecrets] = useState({
    isLoading: false,
    error: null,
    items: [],
  })
  const [predPolicies, setPredPolicies] = useState([])
  const [tags, setTags] = useState([])

  useEffect(() => {
    Log.debug("fetching pools and secrets for select")
    const params = matchParams(props)
    const lbID = params.loadbalancerID
    // get pools for the select
    setPools({ ...pools, isLoading: true })
    fetchPoolsForSelect(lbID)
      .then((data) => {
        setPools({
          ...pools,
          isLoading: false,
          items: data.pools,
          error: null,
        })
      })
      .catch((error) => {
        setPools({ ...pools, isLoading: false, error: error })
      })

    // get the secrets for the select
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
        setSecrets({
          ...secrets,
          isLoading: false,
          error: errorMessage(error),
        })
      })
  }, [])

  useEffect(() => {
    setDisplayPools(pools.items)
    const newItems = [...pools.items]
    for (let i = 0; i < newItems.length; i++) {
      if (newItems[i].tls_enabled == true) {
        const newLabel = `${newItems[i].label} - available with protocol TERMINATED_HTTPS`
        newItems[i] = {
          ...newItems[i],
          ...{ isDisabled: true, label: newLabel },
        }
      }
    }
    setNonSelectableTlsPools(newItems)
  }, [pools])

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

  /*
   * Form stuff
   */
  const [formErrors, setFormErrors] = useState(null)
  const [initialValues, setInitialValues] = useState({ connection_limit: -1 })

  const [insetHeaderSelectItems, setInsertHeaderSelectItems] = useState([])
  const [clientAuthenticationSelectItems, setClientAuthenticationSelectItems] =
    useState([])

  const [insertHeaders, setInsertHeaders] = useState(null)
  const [clientAuthentication, setClientAuthentication] = useState(null)
  const [certificateContainer, setCertificateContainer] = useState(null)
  const [SNIContainers, setSNIContainers] = useState(null)
  const [CATLSContainer, setCATLSContainer] = useState(null)
  const [defaultPool, setDefaultPool] = useState(null)
  const [predefinedPoliciesSelectItems, setPredefinedPoliciesSelectItems] =
    useState(null)
  const [helpBlockItemsPredPolicies, setHelpBlockItemsPredPolicies] =
    useState(null)

  const [showInsertHeaders, setShowInsertHeaders] = useState(false)
  const [showClientAuthentication, setShowClientAuthentication] =
    useState(false)
  const [showCertificateContainer, setShowCertificateContainer] =
    useState(false)
  const [showSNIContainers, setShowSNIContainers] = useState(false)
  const [showCATLSContainer, setShowCATLSContainer] = useState(false)
  const [showPredefinedPolicies, setShowPredefinedPolicies] = useState(false)
  const [showAdvancedSection, setShowAdvancedSection] = useState(false)
  const [showTLSPoolWarning, setShowTLSPoolWarning] = useState(false)

  const validate = ({
    name,
    description,
    protocol_port,
    protocol,
    default_pool_id,
    connection_limit,
    insert_headers,
    default_tls_container_ref,
    sni_container_refs,
    client_authentication,
    client_ca_tls_container_ref,
    tags,
  }) => {
    return name && protocol_port && protocol && true
  }

  const onSubmit = (values) => {
    setFormErrors(null)

    const newValues = { ...values }
    // add optional attributes that not set per context
    if (showInsertHeaders && insertHeaders) {
      newValues.insert_headers = insertHeaders.map((item, index) => item.value)
    }
    if (showClientAuthentication && clientAuthentication) {
      newValues.client_authentication = clientAuthentication.value
    }
    if (showCertificateContainer && certificateContainer) {
      newValues.default_tls_container_ref = certificateContainer.value
    }
    if (showSNIContainers && SNIContainers) {
      newValues.sni_container_refs = SNIContainers.map(
        (item, index) => item.value
      )
    }
    if (showCATLSContainer && CATLSContainer) {
      newValues.client_ca_tls_container_ref = CATLSContainer.value
    }
    const newTags = [...predPolicies, ...tags]
    if (newTags) {
      newValues.tags = newTags.map((item, index) => item.value)
    }

    if (defaultPool) {
      newValues.default_pool_id = defaultPool.value
    }

    // get the lb id
    const params = matchParams(props)
    const lbID = params.loadbalancerID
    return createListener(lbID, newValues)
      .then((response) => {
        addNotice(
          <React.Fragment>
            Listener <b>{response.data.name}</b> ({response.data.id}) is being
            created.
          </React.Fragment>
        )
        // fetch the lb again containing the new listener so it gets updated fast
        persistLoadbalancer(lbID).catch((error) => {})
        // TODO: if the listener contains a pool then fetch the pool again so it gets updated
        close()
      })
      .catch((error) => {
        setFormErrors(formErrorMessage(error))
      })
  }

  const resetOptionalAttributes = () => {
    setInsertHeaders(null)
    setClientAuthentication(null)
    setCertificateContainer(null)
    setSNIContainers(null)
    setCATLSContainer(null)
  }

  const onSelectProtocolType = (props) => {
    if (props) {
      // on change protocol reset optional attributes
      resetOptionalAttributes()
      // load new select options
      setInsertHeaderSelectItems(protocolHeaderInsertionRelation(props.value))
      setClientAuthenticationSelectItems(
        clientAuthenticationRelation(props.value)
      )
      setPredefinedPoliciesSelectItems(predefinedPolicies(props.value))
      setHelpBlockItemsPredPolicies(helpBlockItems(props.value))
      // set options for display
      setShowInsertHeaders(
        (protocolHeaderInsertionRelation(props.value) || []).length > 0
      )
      setShowClientAuthentication(
        (clientAuthenticationRelation(props.value) || []).length > 0
      )
      setShowCertificateContainer(certificateContainerRelation(props.value))
      setShowSNIContainers(SNIContainerRelation(props.value))
      setShowCATLSContainer(CATLSContainerRelation(props.value))
      setShowPredefinedPolicies(predefinedPolicies(props.value).length > 0)
      setShowAdvancedSection(advancedSectionRelation(props.value))

      // TLS-enabled pool can only be attached to a TERMINATED_HTTPS type listener
      // so on change protocol the the default pool will be reseted
      setShowTLSPoolWarning(false)
      if (tlsPoolRelation(props.value)) {
        setDisplayPools(pools.items)
      } else {
        // if pool is not tls reset option
        if (defaultPool && defaultPool.tls_enabled) {
          setDefaultPool(null)
          setShowTLSPoolWarning(true)
        }
        setDisplayPools(nonSelectableTlsPools)
      }
    }
  }
  const onSelectDefaultPoolChange = (props) => {
    setDefaultPool(props)
  }
  const onSelectInsertHeadersChange = (props) => {
    setInsertHeaders(props)
  }
  const onSelectClientAuthentication = (props) => {
    setClientAuthentication(props)
  }
  const onSelectCertificateContainer = (props) => {
    setCertificateContainer(props)
  }
  const onSelectSNIContainers = (props) => {
    setSNIContainers(props)
  }
  const onSelectCATLSContainers = (props) => {
    setCATLSContainer(props)
  }

  const onSelectPredPolicies = (options) => {
    const newOptions = options || []
    setPredPolicies(newOptions)
  }

  const onTagsChange = (options) => {
    setTags(options)
  }

  const protocolTypesFiltered = () => {
    // do not show types disabled
    return protocolTypes().filter((t) => !t.state?.includes("disabled"))
  }

  Log.debug("RENDER new listener")
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
        <Modal.Title id="contained-modal-title-lg">New Listener</Modal.Title>
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
              For the TERMINATED_HTTPS protocol listeners now use the URI of the
              Key Manager service secret containing a PKCS12 format
              certificate/key bundle.
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
            A Listener defines a protocol/port combination under which the load
            balancer can be called.
          </p>
          <Form.Errors errors={formErrors} />

          <Form.ElementHorizontal label="Name" name="name" required>
            <Form.Input elementType="input" type="text" name="name" />
          </Form.ElementHorizontal>
          <Form.ElementHorizontal label="Description" name="description">
            <Form.Input elementType="input" type="text" name="description" />
          </Form.ElementHorizontal>
          <Form.ElementHorizontal
            label="Protocol Port"
            name="protocol_port"
            required
          >
            <Form.Input
              elementType="input"
              type="number"
              min="1"
              max="65535"
              name="protocol_port"
            />
            <span className="help-block">
              <i className="fa fa-info-circle"></i>
              The port under which the load balancer can be called. A port
              number between 1 and 65535.
            </span>
          </Form.ElementHorizontal>
          <Form.ElementHorizontal label="Protocol" name="protocol" required>
            <SelectInput
              name="protocol"
              items={protocolTypesFiltered()}
              onChange={onSelectProtocolType}
            />
            <span className="help-block">
              <i className="fa fa-info-circle"></i>
              The protocol which can be used to access the load balancer port.
            </span>
          </Form.ElementHorizontal>

          <Collapse in={showAdvancedSection}>
            <div className="advanced-options-section">
              <div className="advanced-options">
                {showCertificateContainer && (
                  <React.Fragment>
                    <div>
                      <Form.ElementHorizontal
                        label="Certificate Secret"
                        name="default_tls_container_ref"
                        required
                      >
                        <SelectInput
                          name="default_tls_container_ref"
                          isLoading={secrets.isLoading}
                          items={secrets.items}
                          onChange={onSelectCertificateContainer}
                          value={certificateContainer}
                          useFormContext={false}
                        />
                        <span className="help-block">
                          <i className="fa fa-info-circle"></i>
                          The secret containing a PKCS12 format certificate/key
                          bundles.
                        </span>
                        {secrets.error && (
                          <span className="text-danger">{secrets.error}</span>
                        )}
                      </Form.ElementHorizontal>
                    </div>
                    <div>
                      <p>Optional attributes:</p>
                    </div>
                  </React.Fragment>
                )}

                {showPredefinedPolicies && (
                  <div>
                    <Form.ElementHorizontal
                      label="Extended Policy"
                      name="extended_policies"
                    >
                      <SelectInput
                        name="extended_policies"
                        items={predefinedPoliciesSelectItems}
                        isMulti
                        onChange={onSelectPredPolicies}
                        useFormContext={false}
                      />
                      <span className="help-block">
                        <i className="fa fa-info-circle"></i>
                        <span className="help-block-text">
                          Policies predefined by CCloud for special purpose. The
                          policy will apply specific settings on the load
                          balancer objects. L7Rules are not applicable and the
                          Policy will be applied always. After creation these
                          will be shown as a tag.
                        </span>
                        <HelpPopover
                          text={helpBlockTextForSelect(
                            helpBlockItemsPredPolicies
                          )}
                        />
                      </span>
                    </Form.ElementHorizontal>
                  </div>
                )}

                {showInsertHeaders && (
                  <div>
                    <Form.ElementHorizontal
                      label="Insert Headers"
                      name="insert_headers"
                    >
                      <SelectInput
                        name="insert_headers"
                        items={insetHeaderSelectItems}
                        isMulti
                        onChange={onSelectInsertHeadersChange}
                        value={insertHeaders}
                        useFormContext={false}
                      />
                      <span className="help-block">
                        <i className="fa fa-info-circle"></i>
                        <span className="help-block-text">
                          Headers to insert into the request before it is sent
                          to the backend member.
                        </span>
                        <HelpPopover
                          text={helpBlockTextForSelect(
                            httpHeaderInsertions("ALL")
                          )}
                        />
                      </span>
                    </Form.ElementHorizontal>
                  </div>
                )}

                {showSNIContainers && (
                  <div>
                    <div className="row">
                      <div className="col-sm-8 col-sm-push-4">
                        <div className="bs-callout bs-callout-info bs-callout-emphasize">
                          <p>
                            {" "}
                            Use <b>SNI</b> if you have multiple TLS certificates
                            that you would like to use on the same listener
                            using Server Name Indication (SNI) technology.
                            Please also visit{" "}
                            <a
                              href="https://docs.openstack.org/octavia/latest/user/guides/basic-cookbook.html#deploy-a-tls-terminated-https-load-balancer-with-sni"
                              target="_blank"
                            >
                              the Octavia SNI section
                            </a>{" "}
                            for more information.
                          </p>
                        </div>
                      </div>
                    </div>

                    <Form.ElementHorizontal
                      label="SNI Secrets"
                      name="sni_container_refs"
                    >
                      <SelectInput
                        name="sni_container_refs"
                        isLoading={secrets.isLoading}
                        isMulti
                        items={secrets.items}
                        onChange={onSelectSNIContainers}
                        value={SNIContainers}
                        useFormContext={false}
                      />
                      <span className="help-block">
                        <i className="fa fa-info-circle"></i>A list of secrets
                        containing PKCS12 format certificate/key bundles used
                        for Server Name Indication (SNI).
                      </span>
                      {secrets.error && (
                        <span className="text-danger">{secrets.error}</span>
                      )}
                    </Form.ElementHorizontal>
                  </div>
                )}

                {showClientAuthentication && (
                  <div>
                    <div className="row">
                      <div className="col-sm-8 col-sm-push-4">
                        <div className="bs-callout bs-callout-info bs-callout-emphasize">
                          <p>
                            <b>Client authentication</b> allows users to
                            authenticate themselves to the VIP using
                            certificates. This is also known as two-way TLS
                            authentication. Please also visit{" "}
                            <a
                              href="https://docs.openstack.org/octavia/latest/user/guides/basic-cookbook.html#deploy-a-tls-terminated-https-load-balancer-with-client-authentication"
                              target="_blank"
                            >
                              the Octavia client authentication section
                            </a>{" "}
                            for more information.
                          </p>
                        </div>
                      </div>
                    </div>

                    <Form.ElementHorizontal
                      label="Client Authentication Mode"
                      name="client_authentication"
                    >
                      <SelectInput
                        name="client_authentication"
                        items={clientAuthenticationSelectItems}
                        onChange={onSelectClientAuthentication}
                        value={clientAuthentication}
                        isClearable
                        useFormContext={false}
                      />
                      <span className="help-block">
                        <i className="fa fa-info-circle"></i>
                        The TLS client authentication mode.
                      </span>
                    </Form.ElementHorizontal>
                  </div>
                )}

                {showCATLSContainer && (
                  <div>
                    <Form.ElementHorizontal
                      label="Client Authentication Secret"
                      name="client_ca_tls_container_ref"
                    >
                      <SelectInput
                        name="client_ca_tls_container_ref"
                        isLoading={secrets.isLoading}
                        items={secrets.items}
                        onChange={onSelectCATLSContainers}
                        value={CATLSContainer}
                        isClearable
                        useFormContext={false}
                      />
                      <span className="help-block">
                        <i className="fa fa-info-circle"></i>
                        The secret containing a PEM format client CA certificate
                        bundle.
                      </span>
                      {secrets.error && (
                        <span className="text-danger">{secrets.error}</span>
                      )}
                    </Form.ElementHorizontal>
                  </div>
                )}
              </div>
            </div>
          </Collapse>

          <Collapse in={showTLSPoolWarning}>
            <div className="row">
              <div className="col-sm-8 col-sm-push-4">
                <div className="bs-callout bs-callout-warning bs-callout-emphasize">
                  <p>
                    TLS-enabled pool can only be attached to a{" "}
                    <b>TERMINATED_HTTPS</b> type listener!
                  </p>
                  <p>
                    Switch to TERMINATED_HTTPS protocol to see TLS-enalbed pools
                  </p>
                </div>
              </div>
            </div>
          </Collapse>

          <Form.ElementHorizontal label="Default Pool" name="default_pool_id">
            <SelectInput
              name="default_pool_id"
              value={defaultPool}
              isLoading={pools.isLoading}
              items={displayPools}
              onChange={onSelectDefaultPoolChange}
              useFormContext={false}
              isClearable
            />
            {pools.error ? (
              <span className="text-danger">{pools.error}</span>
            ) : (
              ""
            )}
            <span className="help-block">
              <i className="fa fa-info-circle"></i>
              The pool to which all traffic will be routed if no L7 Policy
              defines a different pool.
            </span>
          </Form.ElementHorizontal>
          <Form.ElementHorizontal
            label="Connection Limit"
            name="connection_limit"
          >
            <Form.Input
              elementType="input"
              type="number"
              min="-1"
              name="connection_limit"
            />
            <span className="help-block">
              <i className="fa fa-info-circle"></i>
              The number of parallel connections allowed to access the load
              balancer. Value -1 means infinite connections are allowed.
            </span>
          </Form.ElementHorizontal>

          <Form.ElementHorizontal label="Tags" name="tags">
            <TagsInput
              name="tags"
              useFormContext={false}
              onChange={onTagsChange}
            />
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

export default NewListener
