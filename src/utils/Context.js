import makeContext from './makeContext'

const { Provider, Consumer, withConsumer } = makeContext({
  displayName: 'ReactChart',
  initialState: {
    hovered: {
      active: false,
      series: null,
      datums: [],
    },
    cursors: {},
    axes: {},
    pointer: {},
  },
})

export { Provider, Consumer, withConsumer }
