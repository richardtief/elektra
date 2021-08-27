/* eslint no-console:0 */
import React from "react"
import { BrowserRouter, Route, Redirect } from "react-router-dom"

import StateProvider from "./stateProvider"
import { reducer, initialState } from "./reducers"

import Containers from "./components/containers/list"
import ContainerProperties from "./components/containers/properties"
import DeleteContainer from "./components/containers/delete"
import EmptyContainer from "./components/containers/empty"
import NewContainer from "./components/containers/new"
import ContainerAccessControl from "./components/containers/accessControl"

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

      <Route
        exact
        path="/containers/:name/properties"
        component={ContainerProperties}
      />
      <Route
        exact
        path="/containers/:name/delete"
        component={DeleteContainer}
      />
      <Route
        exact
        path="/containers/:name/access-control"
        component={ContainerAccessControl}
      />
      <Route exact path="/containers/:name/empty" component={EmptyContainer} />
    </BrowserRouter>
  </StateProvider>
)
