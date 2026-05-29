import React, { useState, useCallback } from 'react'
import type { HeadingNode } from '../../types'
import './OutlinePanel.css'

interface OutlinePanelProps {
  headings: HeadingNode[]
  isOpen: boolean
  onJump: (heading: HeadingNode) => void
  emptyText: string
  titleText: string
}

/** Single node in the heading tree (recursive). */
function TreeItem({
  node,
  depth,
  onJump,
}: {
  node: HeadingNode
  depth: number
  onJump: (h: HeadingNode) => void
}) {
  const hasChildren = node.children.length > 0
  const [collapsed, setCollapsed] = useState(false)

  const handleToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setCollapsed(c => !c)
  }, [])

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onJump(node)
    // Also auto-expand if collapsed
    if (collapsed) setCollapsed(false)
  }, [node, onJump, collapsed])

  return (
    <div className="outline-tree-item">
      <div
        className="outline-tree-row"
        style={{ paddingLeft: `${8 + depth * 14}px` }}
        onClick={handleClick}
        title={node.text}
      >
        {/* Expand/collapse toggle or placeholder */}
        <span
          className={`outline-toggle ${hasChildren ? '' : 'invisible'}`}
          onClick={hasChildren ? handleToggle : undefined}
        >
          {collapsed ? '▸' : '▾'}
        </span>

        {/* Heading level badge */}
        <span className={`outline-badge lvl-${node.level}`}>h{node.level}</span>

        {/* Heading text */}
        <span className="outline-label">{node.text}</span>
      </div>

      {/* Children (if expanded) */}
      {hasChildren && !collapsed && (
        <div className="outline-children">
          {node.children.map(child => (
            <TreeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              onJump={onJump}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function OutlinePanel({
  headings,
  isOpen,
  onJump,
  emptyText,
  titleText,
}: OutlinePanelProps) {
  if (!isOpen) return null

  return (
    <div className="outline-panel">
      <div className="outline-header">
        <span className="outline-title">{titleText}</span>
        <span className="outline-count">{headings.length > 0 ? headings.length : ''}</span>
      </div>

      <div className="outline-body">
        {headings.length === 0 ? (
          <div className="outline-empty">{emptyText}</div>
        ) : (
          headings.map(node => (
            <TreeItem key={node.id} node={node} depth={0} onJump={onJump} />
          ))
        )}
      </div>
    </div>
  )
}
