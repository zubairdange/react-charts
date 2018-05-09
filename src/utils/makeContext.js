import React from 'react'
import hoistNonReactStatics from 'hoist-non-react-statics'

//

const defualtSubscribe = state => state
const defaultMiddleware = ({ action, setState }) =>
  new Promise(resolve => setState(action, resolve))
const globalDefaultProps = {
  name: 'NewContext',
  initialState: {},
  middleware: defaultMiddleware,
}

export default function makeContext (userDefaultProps) {
  const Context = React.createContext({})

  const defaultProps = {
    ...globalDefaultProps,
    ...userDefaultProps,
  }

  class Provider extends React.Component {
    static defaultProps = defaultProps
    static displayName = `${defaultProps.displayName}Provider`
    constructor (props) {
      super(props)
      const { initialState, middleware, ...rest } = this.props
      this.state = {
        ...this.props.initialState,
        ...rest,
        dispatch: this.dispatch, // eslint-disable-line
      }
    }
    static getDerivedStateFromProps = nextProps => {
      const { initialState, middlware, ...rest } = nextProps
      return rest
    }
    safeSetState = (...args) => this.setState(...args)
    dispatch = action =>
      this.props.middleware({
        action,
        setState: this.safeSetState,
        state: this.state,
        props: this.props,
      })
    render () {
      return <Context.Provider value={this.state}>{this.props.children}</Context.Provider>
    }
  }

  class Consumer extends React.Component {
    static defaultProps = {
      subscribe: defualtSubscribe,
    }
    static displayName = `${defaultProps.displayName}Consumer`
    constructor (props) {
      super(props)
      this.getSubscriber()
    }
    getSubscriber = () => {
      const { subscribe } = this.props
      let hasSelectors
      try {
        if (typeof subscribe({}) === 'function') {
          hasSelectors = true
        }
      } catch (err) {
        //
      }

      if (hasSelectors) {
        this.subscribe = subscribe()
      } else {
        this.subscribe = subscribe
      }
    }
    render () {
      const {
        render, children, component, subscribe, ...rest
      } = this.props
      return (
        <Context.Consumer>
          {({ dispatch, ...state }) =>
            (render || children)({ ...this.subscribe(state, rest), dispatch })
          }
        </Context.Consumer>
      )
    }
  }

  const withConsumer = subscribe => Component => {
    class withConsumer extends React.Component {
      render () {
        return (
          <Consumer
            subscribe={subscribe}
            render={state => <Component {...state} {...this.props} />}
            {...this.props}
          />
        )
      }
    }
    hoistNonReactStatics(withConsumer, Component)
    return withConsumer
  }

  return {
    Provider,
    Consumer,
    withConsumer,
  }
}

// Usage

// // Make a new context with default props
// const { Provider, Consumer, withConsumer } = makeContext({
//   displayName: 'Todos',
//   initialState: {
//     todos: [],
//   },
// })

// // You can use selectors
// const selectTodos = state => ({ todos: state.todos })

// // Render-prop style
// const OnTheFlyTodos = () => (
//   <Consumer subscribe={selectTodos} render={({ todos }) => <div>{todos}</div>} />
// )
// // HOC style
// const HocTodos = withConsumer(selectTodos)(({ todos }) => <div>{todos}</div>)
// // Pure HOC style
// const PureTodos = withConsumer(selectTodos)(
//   class extends React.PureComponent {
//     render () {
//       const { todos } = this.props
//       return <div>{todos}</div>
//     }
//   }
// )

// const App = (
//   <Provider
//     // You can optionally override the initial state on the Provider
//     initialState={{
//       todos: [],
//     }}
//     // You can optionally override the middleware on the Provider
//     middleware={({
//  action, setState, state, props,
// }) => {
//       /* */
//     }}
//   >
//     <div>
//       <OnTheFlyTodos />
//       <HocTodos />
//       <PureTodos />
//     </div>
//   </Provider>
// )
