import React, { Component } from 'react'
import RAF from 'raf'
//
import { Provider, Consumer } from '../utils/Context'
import Selectors from '../utils/Selectors'
import HyperResponsive from '../utils/HyperResponsive'
import Utils from '../utils/Utils'
import * as Debug from '../utils/Debug'

import Rectangle from '../primitives/Rectangle'
import Voronoi from '../components/Voronoi'

const debug = process.env.NODE_ENV === 'development'

class Chart extends Component {
  static defaultProps = {
    getSeries: d => d,
    getDatums: d => (Utils.isArray(d) ? d : d.datums || d.data),
    getLabel: (d, i) => d.label || `Series ${i + 1}`,
    getSeriesID: (d, i) => i,
    getPrimary: d => (Utils.isArray(d) ? d[0] : d.primary || d.x),
    getSecondary: d => (Utils.isArray(d) ? d[1] : d.secondary || d.y),
    getR: d => (Utils.isArray(d) ? d[2] : d.radius || d.r),
    getPrimaryAxisID: s => s.primaryAxisID,
    getSecondaryAxisID: s => s.secondaryAxisID,
    onHover: () => {},
    interaction: null,
    hoverMode: 'primary',
    groupMode: 'primary',
    showVoronoi: false,
  }
  componentDidMount () {
    const {
      interaction, hoverMode, groupMode, showVoronoi, dispatch,
    } = this.props
    if (interaction) {
      dispatch(state => ({
        ...state,
        interaction,
      }))
    }
    if (hoverMode) {
      dispatch(state => ({
        ...state,
        hoverMode,
      }))
    }
    if (groupMode) {
      dispatch(state => ({
        ...state,
        groupMode,
      }))
    }
    if (showVoronoi) {
      dispatch(state => ({
        ...state,
        showVoronoi,
      }))
    }
    this.updatePreMaterializedData()
  }
  componentDidUpdate (oldProps) {
    const newProps = this.props
    const { dispatch } = newProps
    // If anything related to the data model changes, update it
    if (newProps.interaction !== oldProps.interaction) {
      dispatch(state => ({
        ...state,
        interaction: newProps.interaction,
      }))
    }

    if (newProps.hoverMode !== oldProps.hoverMode) {
      dispatch(state => ({
        ...state,
        hoverMode: newProps.hoverMode,
      }))
    }
    if (newProps.groupMode !== oldProps.groupMode) {
      dispatch(state => ({
        ...state,
        groupMode: newProps.groupMode,
      }))
    }
    if (newProps.showVoronoi !== oldProps.showVoronoi) {
      dispatch(state => ({
        ...state,
        showVoronoi: newProps.showVoronoi,
      }))
    }

    if (
      newProps.data !== oldProps.data ||
      newProps.width !== oldProps.width ||
      newProps.height !== oldProps.height ||
      newProps.getSeries !== oldProps.getSeries ||
      newProps.getDatums !== oldProps.getDatums ||
      newProps.getSeriesID !== oldProps.getSeriesID ||
      newProps.getLabel !== oldProps.getLabel ||
      newProps.getPrimary !== oldProps.getPrimary ||
      newProps.getSecondary !== oldProps.getSecondary ||
      newProps.getR !== oldProps.getR ||
      newProps.getPrimaryAxisID !== oldProps.getPrimaryAxisID ||
      newProps.getSecondaryAxisID !== oldProps.getSecondaryAxisID
    ) {
      this.updatePreMaterializedData()
    }
    RAF(() => this.measure(oldProps))
  }
  updatePreMaterializedData = () => {
    const { data } = this.props
    let {
      getSeries,
      getDatums,
      getLabel,
      getSeriesID,
      getPrimary,
      getSecondary,
      getR,
      getPrimaryAxisID,
      getSecondaryAxisID,
    } = this.props

    // Normalize getters
    getSeries = Utils.normalizePathGetter(getSeries)
    getDatums = Utils.normalizePathGetter(getDatums)
    getLabel = Utils.normalizePathGetter(getLabel)
    getSeriesID = Utils.normalizePathGetter(getSeriesID)
    getPrimary = Utils.normalizePathGetter(getPrimary)
    getSecondary = Utils.normalizePathGetter(getSecondary)
    getR = Utils.normalizePathGetter(getR)
    getPrimaryAxisID = Utils.normalizePathGetter(getPrimaryAxisID)
    getSecondaryAxisID = Utils.normalizePathGetter(getSecondaryAxisID)

    // Check for data
    if (!data) {
      if (debug) Debug.noData(this)
      return
    }

    // getSeries
    const series = getSeries(data)

    // Check for data
    if (!series) {
      if (debug) Debug.noData(this)
      return
    }

    // First access the data, and provide it to the context
    const preMaterializedData = series.map((s, seriesIndex) => {
      const seriesID = getSeriesID(s, seriesIndex, data)
      const seriesLabel = getLabel(s, seriesIndex, data)
      const primaryAxisID = getPrimaryAxisID(s, seriesIndex, data)
      const secondaryAxisID = getSecondaryAxisID(s, seriesIndex, data)
      const series = {
        original: s,
        index: seriesIndex,
        id: seriesID,
        label: seriesLabel,
        primaryAxisID,
        secondaryAxisID,
        datums: getDatums(s, seriesIndex, data).map((d, index) => ({
          originalSeries: s,
          seriesIndex,
          seriesID,
          seriesLabel,
          index,
          original: d,
          primary: getPrimary(d, index, s, seriesIndex, data),
          secondary: getSecondary(d, index, s, seriesIndex, data),
          r: getR(d, index, s, seriesIndex, data),
        })),
      }
      return series
    })

    // Provide the preMaterializedData to the chart instance
    this.props.dispatch(state => ({
      ...state,
      preMaterializedData,
    }))
  }
  measure = oldProps => {
    if (
      oldProps &&
      (this.props.offset.left !== oldProps.offset.left ||
        this.props.offset.top !== oldProps.offset.top)
    ) {
      this.props.dispatch(state => ({
        ...state,
        offset: {
          left: this.el.offsetLeft,
          top: this.el.offsetTop,
        },
      }))
    }
  }
  onMouseMove = Utils.throttle(e => {
    console.log('move')
    const { clientX, clientY } = e
    this.dims = this.el.getBoundingClientRect()
    const { gridX, gridY, dispatch } = this.props

    dispatch(state => {
      const x = clientX - this.dims.left - gridX
      const y = clientY - this.dims.top - gridY

      const pointer = {
        ...state.pointer,
        active: true,
        x,
        y,
        dragging: state.pointer && state.pointer.down,
      }
      return {
        ...state,
        pointer,
      }
    })
  })
  onMouseLeave = () => {
    const { dispatch } = this.props
    dispatch(state => ({
      ...state,
      pointer: {
        ...state.pointer,
        active: false,
      },
      hovered: {
        ...state.hovered,
        active: false,
      },
    }))
  }
  onMouseDown = () => {
    const { dispatch } = this.props

    document.addEventListener('mouseup', this.onMouseUp)
    document.addEventListener('mousemove', this.onMouseMove)

    dispatch(state => ({
      ...state,
      pointer: {
        ...state.pointer,
        sourceX: state.pointer.x,
        sourceY: state.pointer.y,
        down: true,
      },
    }))
  }
  onMouseUp = () => {
    const { dispatch } = this.props

    document.removeEventListener('mouseup', this.onMouseUp)
    document.removeEventListener('mousemove', this.onMouseMove)

    dispatch(state => ({
      ...state,
      pointer: {
        ...state.pointer,
        down: false,
        dragging: false,
        released: {
          x: state.pointer.x,
          y: state.pointer.y,
        },
      },
    }))
  }
  render () {
    const {
      style, width, height, handleRef, gridX, gridY, children,
    } = this.props

    const allChildren = React.Children.toArray(children)
    const svgChildren = allChildren.filter(d => !d.type.isHtml)
    const htmlChildren = allChildren.filter(d => d.type.isHtml)

    return (
      <div
        ref={handleRef}
        className="ReactChart"
        style={{
          width,
          height,
          position: 'relative',
        }}
        onMouseEnter={e => {
          e.persist()
          this.onMouseMove(e)
        }}
        onMouseMove={e => {
          e.persist()
          this.onMouseMove(e)
        }}
        onMouseLeave={this.onMouseLeave}
        onMouseDown={this.onMouseDown}
      >
        <svg
          ref={el => {
            this.el = el
          }}
          style={{
            width,
            height,
            overflow: 'hidden',
            ...style,
          }}
        >
          <g transform={`translate(${gridX || 0}, ${gridY || 0})`}>
            <Rectangle
              // This is to ensure the pointer always has something to hit
              x1={-gridX}
              x2={width - gridX}
              y1={-gridY}
              y2={height - gridY}
              style={{
                opacity: 0,
              }}
            />
            <Voronoi />
            {svgChildren}
          </g>
        </svg>
        {htmlChildren}
      </div>
    )
  }
}

const subscribe = () => {
  const selectors = {
    gridWidth: Selectors.gridWidth(),
    gridHeight: Selectors.gridHeight(),
    gridX: Selectors.gridX(),
    gridY: Selectors.gridY(),
    offset: Selectors.offset(),
  }
  return state => ({
    width: state.width,
    height: state.height,
    active: state.active,
    selected: state.selected,
    gridWidth: selectors.gridWidth(state),
    gridHeight: selectors.gridHeight(state),
    gridX: selectors.gridX(state),
    gridY: selectors.gridY(state),
    offset: selectors.offset(state),
  })
}

export default function ReactChart (props) {
  return (
    <HyperResponsive
      render={({ handleRef, width, height }) => (
        <Provider width={width} height={height}>
          <Consumer
            subscribe={subscribe}
            render={context => <Chart {...props} handleRef={handleRef} {...context} />}
          />
        </Provider>
      )}
    />
  )
}
