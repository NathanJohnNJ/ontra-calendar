'use client'

import type { ReactNode } from 'react'
import { Grip } from 'lucide-react'
import type { Layout } from 'react-grid-layout'

export type WidgetFrameProps = {
  children: ReactNode
  editMode: boolean
  widgetId: string
  ariaLabel?: string
  visible: boolean
  onVisibilityChange: (visible: boolean) => void
  className?: string
  resizeHandles?: Layout[number]['resizeHandles']
}

export function WidgetFrame({
  children,
  editMode,
  widgetId,
  visible,
  onVisibilityChange,
  className = '',
  ariaLabel,
}: WidgetFrameProps) {
  return (
    <section
      className={`dashboard-widget widget-shell widget-interactive ${!visible ? (editMode ? 'widget-is-hidden' : 'widget-is-removed') : ''} ${className}`}
      data-widget-id={widgetId}
      aria-label={ariaLabel}
    >
      {editMode && (
        <div className="widget-edit-controls" aria-label={`${widgetId} widget controls`}>
          <div className="widget-handle" role="button" tabIndex={0} aria-label={`Drag ${widgetId} widget`}>
            <Grip aria-hidden="true" />
          </div>
          <label
            className="widget-visibility-toggle"
            aria-label={`${visible ? 'Hide' : 'Show'} ${widgetId} widget`}
            onMouseDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
          >
            <input type="checkbox" checked={visible} onChange={(event) => onVisibilityChange(event.target.checked)} />
          </label>
        </div>
      )}
      {children}
    </section>
  )
}

export type { WidgetFrameProps as WidgetComponentProps }
