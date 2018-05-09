import React, { Component } from 'react'
import { withConsumer } from '../utils/Context'
//
import Selectors from '../utils/Selectors'
// import Rectangle from '../primitives/Rectangle'

class Brush extends Component {
  static defaultProps = {
    onSelect: () => {},
  }
  static isHtml = true
  componentDidUpdate (oldProps) {
    const newProps = this.props
    const { onSelect, pointer, primaryAxes } = newProps
    if (pointer && oldProps.pointer.released !== pointer.released) {
      if (Math.abs(pointer.sourceX - pointer.x) < 20) {
        return
      }
      onSelect({
        pointer: pointer.released,
        start: primaryAxes[0].scale.invert(pointer.sourceX),
        end: primaryAxes[0].scale.invert(pointer.x),
      })
    }
  }
  render () {
    const {
      pointer = {}, offset, gridX, gridY, gridHeight, style = {},
    } = this.props

    return (
      <div
        className="Brush"
        style={{
          pointerEvents: 'none',
          position: 'absolute',
          left: `${offset.left + gridX}px`,
          top: `${offset.top + gridY}px`,
          opacity: pointer.dragging ? (Math.abs(pointer.sourceX - pointer.x) < 20 ? 0.5 : 1) : 0,
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: `${Math.min(pointer.x, pointer.sourceX)}px`,
            width: `${Math.abs(pointer.x - pointer.sourceX)}px`,
            height: `${gridHeight}px`,
            background: 'rgba(0,0,0,.3)',
            ...style,
          }}
        />
      </div>
    )
  }
}

export default withConsumer(() => {
  const selectors = {
    primaryAxes: Selectors.primaryAxes(),
    offset: Selectors.offset(),
    gridHeight: Selectors.gridHeight(),
    gridX: Selectors.gridX(),
    gridY: Selectors.gridY(),
  }
  return state => ({
    primaryAxes: selectors.primaryAxes(state),
    pointer: state.pointer,
    offset: selectors.offset(state),
    gridHeight: selectors.gridHeight(state),
    gridX: selectors.gridX(state),
    gridY: selectors.gridY(state),
  })
})(Brush)
