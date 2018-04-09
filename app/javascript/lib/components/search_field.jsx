import { Popover, OverlayTrigger } from 'react-bootstrap';

let counter = 0;

export default class SearchField extends React.Component {
  state = {
    searchTerm: ''
  }

  infoText =
    <Popover id={`search_field_${this.props.id || counter++}`}>
      {this.props.text}
    </Popover>

  onChangeTerm = (e) => {
    const value = e.target.value || ''
    this.setState({searchTerm: value}, () => this.props.onChange(value))
  }

  reset = (e) => {
    e.preventDefault()
    this.setState({searchTerm: ''}, () => this.props.onChange(''))
  }

  render() {
    const empty = this.state.searchTerm.trim().length==0

    return (
      <React.Fragment>
        <div className="has-feedback has-feedback-searchable">
          <input
            type="text"
            className="form-control"
            value={this.state.searchTerm}
            placeholder={this.props.placeholder}
            onChange={this.onChangeTerm}
          />
        <span
          className={`form-control-feedback ${!empty && 'not-empty'}`}
          onClick={(e) => !empty && this.reset(e)}>
            <i className={`fa ${empty ? 'fa-search' : 'fa-times-circle'}`}/>
          </span>
        </div>
        <div className="has-feedback-help">
          <OverlayTrigger trigger="click" placement="top" rootClose overlay={this.infoText}>
            <a className='help-link' href='javascript:void(0)'>
              <i className="fa fa-question-circle"></i>
            </a>
          </OverlayTrigger>
        </div>
      </React.Fragment>
    )
  }
}
