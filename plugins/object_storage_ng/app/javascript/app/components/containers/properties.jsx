import { Modal, Button, Alert } from "react-bootstrap"
import { Form } from "lib/elektra-form"
import { useHistory, useParams, Link } from "react-router-dom"
import { useDispatch, useGlobalState } from "../../stateProvider"
import React from "react"
import { Unit } from "lib/unit"
const unit = new Unit("B")
import * as apiClient from "../../lib/apiClient"

/**
 * This Component renders custom metadata tags.
 * the name of custom tags starts with meta_
 * @param {map} props
 * @returns component
 */
const CustomMetaTags = ({ values, onChange, reservedKeys }) => {
  const [error, setError] = React.useState()

  reservedKeys = reservedKeys || []
  // example of values:
  // [ { "key": "meta_key1", "value": "value1" } ]

  // filter out empty tags (key is empty)
  // and add a new entry for further tags
  const tags = React.useMemo(() => {
    if (!values) return []
    const result = values.slice().filter((v) => v.key && v.key.length > 0)
    result.push({ key: "", value: "" })
    return result
  }, [values])

  // update custom metadata tags
  // updates requires two params:
  // 1. identifier of the entry e.g. 0
  // 2. new key or new value or both of them
  // example: update(0, { "key": "meta_xyz"})
  // example: update(1, { "value": "valueXYZ"})
  const update = React.useCallback(
    (index, { key, value }) => {
      let errors = []
      // do not allow to overwrite existing keys
      const oldKeys = tags.map((t) => t.key)
      if (!value && key && oldKeys.includes(`meta_${key}`))
        errors.push("the key already exists")
      // do not allow to overwrite reserved keys
      if (reservedKeys.indexOf(`meta_${key}`) >= 0) {
        errors.push("reserved key (will be ignored)")
      }
      setError(errors.length > 0 ? errors.join(", ") : null)

      const newValues = tags.slice()
      if (key !== undefined) newValues[index].key = key
      if (value !== undefined) newValues[index].value = value

      onChange(newValues)
    },
    [tags]
  )

  return (
    <React.Fragment>
      <div className="small">
        Reserved keys:{" "}
        {reservedKeys.map((k) => k.replace("meta_", "")).join(", ")}
      </div>
      {error && <Alert bsStyle="danger">{error}</Alert>}
      {tags.map((tag, i) => (
        <React.Fragment key={i}>
          {console.log(i, tag)}
          <div className="input-group">
            <input
              type="text"
              value={tag ? tag.key.replace("meta_", "") : ""}
              placeholder="Key"
              onChange={(e) => {
                e.preventDefault()
                update(i, { key: e.target.value })
              }}
              className="string optional form-control"
            />
            <div className="input-group-addon">=</div>
            <input
              type="text"
              value={tag.value || ""}
              onChange={(e) => {
                e.preventDefault()
                update(i, { value: e.target.value })
              }}
              placeholder="Value"
              className="string optional form-control"
            />
          </div>
        </React.Fragment>
      ))}
    </React.Fragment>
  )
}

const FormBody = ({ containerName, otherContainers }) => {
  const { formValues: values, onChange } = React.useContext(Form.Context)

  return (
    <React.Fragment>
      <br />
      <Alert>{JSON.stringify(values, null, 2)}</Alert>
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
            name="meta_quota_count"
            inline
          >
            <Form.Input
              placeholder="Leave empty to disable"
              elementType="input"
              type="number"
              name="meta_quota_count"
            />
          </Form.Element>
          <Form.Element label="Total size quota" name="meta_quota_bytes" inline>
            <Form.Input
              placeholder="Leave empty to disable"
              elementType="input"
              type="text"
              name="meta_quota_bytes"
            />
          </Form.Element>
        </div>
      </div>
      {/[.]r:/.test(values.read) && (
        <React.Fragment>
          <label className="control-label">
            URL for public access{" "}
            <a href={values.public_url} target="_blank">
              (Open in new tab)
            </a>
          </label>
          <div className="form-group">
            <input
              className="form-control"
              type="text"
              disabled
              defaultValue={values.public_url}
            />
          </div>
        </React.Fragment>
      )}
      {values.cap_staticweb && (
        <div className="form-group">
          <label>Static website serving</label>
          {values.read == ".r:*,.rlistings" ? (
            <React.Fragment>
              <div className="row">
                <div className="col-md-6">
                  <div className="checkbox">
                    <label>
                      <Form.Input
                        elementType="input"
                        type="checkbox"
                        name="meta_web_index_enabled"
                      />{" "}
                      Serve objects as{" "}
                      {values.meta_web_index.replace(".html", "")}
                      {values.meta_web_index_enabled && " when file name is:"}
                    </label>
                  </div>
                </div>
                <div className="col-md-6">
                  {values.meta_web_index_enabled && (
                    <Form.Input
                      elementType="input"
                      type="text"
                      name="meta_web_index"
                    />
                  )}
                </div>
              </div>
              <div className="row">
                <div className="col-md-12">
                  <div className="checkbox">
                    <label>
                      <Form.Input
                        elementType="input"
                        type="checkbox"
                        name="meta_web_listings"
                      />{" "}
                      Enable file listing{" "}
                      <i
                        className="fa fa-question-circle help_icon"
                        title="If there is no index file, the URL displays a list of objects in the container."
                      />
                    </label>
                  </div>
                </div>
              </div>
            </React.Fragment>
          ) : (
            <div className="bs-callout bs-callout-info">
              Before configuring static website serving, go to{" "}
              <Link to={`/containers/${containerName}/access-control`}>
                Access control
              </Link>{" "}
              and enable public read access.
            </div>
          )}
        </div>
      )}
      <div className="form-group">
        <label>Object versioning</label>

        <div className="row">
          <div className="col-md-6">
            <div className="checkbox">
              <label>
                <Form.Input
                  elementType="input"
                  type="checkbox"
                  name="versions_location_enabled"
                />{" "}
                Store old object versions{" "}
                {values.versions_location_enabled && " in container:"}
              </label>
            </div>
          </div>

          <div className="col-md-6">
            {values.versions_location_enabled && (
              <Form.Input
                elementType="select"
                className="select required form-control"
                name="versions_location"
              >
                <option></option>
                {otherContainers.map((c, i) => (
                  <option key={i} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </Form.Input>
            )}
          </div>
        </div>
      </div>

      <div className="form-group">
        <label>Metadata</label>
        <CustomMetaTags
          reservedKeys={[
            "meta_web_index",
            "meta_web_listings",
            "meta_web_index",
          ]}
          values={values.customMetadataTags}
          onChange={(newValues) => onChange("customMetadataTags", newValues)}
        />
      </div>
    </React.Fragment>
  )
}

const ContainerProperties = ({}) => {
  const { name } = useParams()
  const history = useHistory()
  const [show, setShow] = React.useState(!!name)
  const [error, setError] = React.useState()
  const { containers, capabilities } = useGlobalState()
  const dispatch = useDispatch()

  const container = React.useMemo(() => {
    if (!containers?.items) return
    return containers.items.find((c) => c.name === name)
  }, [containers])

  // const customMetadataTags = React.useMemo(() => {
  //   if (!container?.metadata) return {}
  //   const result = {}
  //   Object.keys(container.metadata).forEach((k) => {
  //     if (
  //       k.startsWith("meta_") &&
  //       !k.startsWith("meta_web") &&
  //       !k.startsWith("meta_quota")
  //     )
  //       result[k] = container.metadata[k]
  //   })
  //   return result
  // }, [container])

  const customMetadataTags = React.useMemo(() => {
    if (!container?.metadata) return []
    const result = []
    Object.keys(container.metadata).forEach((k) => {
      if (
        k.startsWith("meta_") &&
        !k.startsWith("meta_web") &&
        !k.startsWith("meta_quota")
      )
        result.push({ key: k, value: container.metadata[k] })
    })
    return result
  }, [container])

  React.useEffect(() => {
    // be carefull! changing this if query can result in infinity loops
    if (containers.isFetching) return
    dispatch({ type: "REQUEST_CONTAINER_METADATA", name: name })
    apiClient
      .get(`containers/${name}/metadata`)
      .then((metadata) => {
        dispatch({
          type: "RECEIVE_CONTAINER_METADATA",
          name: name,
          metadata,
        })
      })
      .catch((error) => {
        setError(error.message)
      })
  }, [containers.isFetching, name, dispatch])

  const otherContainers = React.useMemo(() => {
    if (containers.isFetching) return
    return containers.items.filter((i) => i.name !== name)
  }, [containers, name])

  const close = React.useCallback((e) => {
    setShow(false)
  }, [])

  const back = React.useCallback((e) => {
    history.replace("/containers")
  }, [])

  const initialValues = React.useMemo(() => {
    if (!container || !container.metadata) return {}
    return {
      ...container.metadata,
      versions_location: container.metadata?.x_versions_location,
      versions_location_enabled: !!container.metadata?.x_versions_location,
      cap_staticweb: capabilities.data?.staticweb,
      meta_web_index_enabled: !!container.metadata?.meta_web_index,
      meta_web_listings: !!container.metadata?.meta_web_listings,
      meta_web_index: container.metadata?.meta_web_index || "index.html",
      total_size: unit.format(container.bytes),
      customMetadataTags,
    }
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
          {JSON.stringify(container, null, 2)}
          {/* <pre>{JSON.stringify(capabilities, null, 2)}</pre> */}
          {containers.isFetching || container?.isFetchingMetadata ? (
            <span>
              <span className="spinner" />
              Loading...
            </span>
          ) : !container ? (
            <span>Container not found!</span>
          ) : error ? (
            <Alert bsStyle="danger">{error}</Alert>
          ) : (
            <FormBody
              containerName={container?.name}
              otherContainers={otherContainers}
            />
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
