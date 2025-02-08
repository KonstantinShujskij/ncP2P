import React from "react"
import { useRoutes } from './routes/routes'
import { useSelector } from "react-redux"

import * as authSelectors from './redux/selectors/auth.selectors'

import Alert from './components/Alert/Alert'


function App() {
  const isAuth = useSelector(authSelectors.isAuth)
  const routes = useRoutes(isAuth)

  return (
    <div className="app">
      <Alert />

      <main className="main">
        {routes}
      </main>
    </div>
  )
}

export default App
