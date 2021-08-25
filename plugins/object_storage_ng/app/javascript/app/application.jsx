/* eslint no-console:0 */
import React from "react"
import { BrowserRouter, Route, Redirect } from "react-router-dom"

import StateProvider from "./stateProvider"
import { reducer, initialState } from "./reducers"

import Containers from "./components/containers/list"
import ContainerProperties from "./components/containers/properties"
// import ShowContainerModal from "./components/containers/show"
import NewContainer from "./components/containers/new"

// render all components inside a hash router
export default (props) => (
  <StateProvider reducer={reducer} initialState={initialState}>
    <BrowserRouter basename={`${window.location.pathname}?r=`}>
      {/* redirect root to shares tab */}
      <Route exact path="/">
        <Redirect to="/containers" />
      </Route>
      <Route path="/containers" component={Containers} />
      <Route exact path="/containers/new" component={NewContainer} />
      {/* <Route exact path="/containers/:id/show" component={ShowContainerModal} /> */}
      <Route
        exact
        path="/containers/:name/properties"
        component={ContainerProperties}
      />
    </BrowserRouter>
  </StateProvider>
)
