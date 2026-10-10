<template>
  <div class="mindmap-container">
    <div class="save-indicator" :class="{ visible: saveStatus }">
      <span class="spinner" v-if="saveStatus === 'saving'"></span>
      <span class="save-icon" v-else-if="saveStatus === 'saved'">✓</span>
      <span>{{ saveStatus === 'saving' ? 'Saving mindmap...' : 'Saved successfully!' }}</span>
    </div>
    <main class="main-content">
      <!-- Collapsible Sidebar / Toolbar -->
      <!-- REFACTOR/Sidebar -->
      <LeftSidebar
        :is-toolbar-collapsed="isToolbarCollapsed"
        :current-file-name="currentFileName"
        :nodes="nodes"
        :edges="edges"
        :is-read-only="isReadOnly"

        :has-node-selection="hasNodeSelection"
        :colors="colors"
        :selected-node-id="selectedNodeId"
        :selected-node-ids="selectedNodeIds"

        :edge="getSelectedEdge"
        :selected-edge-id="selectedEdgeId"
        :direction-label="getEdgeDirectionLabel"

        @toggle-toolbar="toggleToolbar"
        @add-node="addNode()"
        @recenter-mindmap="recenterMap"
        @toggle-readonly="toggleReadOnly"

        @save-mindmap="saveMindmap"
        @save-as-mindmap="saveAsMindmap"
        @load-mindmap="loadMindmap"

        @duplicate="duplicateSelectedNodes"
        @update-color="updateNodeColor"
        @update-zindex="updateNodeZIndex"
        @lock-movement="lockNodePosition"

        @switch-direction="switchEdgeDirection"
        @update-label="updateEdgeLabel"
        @toggle-style="toggleEdgeStyle"
        @remove-edge="deleteSelectedEdge"
      />

      <section class="canvas-area">
        <TopNavBar />
        <VueFlow
          v-model:nodes="nodes"
          v-model:edges="edges"
          :node-types="nodeTypes"
          :connection-mode="ConnectionMode.Loose"
          :auto-bring-nodes-to-front="false"
          :min-zoom="0.2"
          :pan-activation-key-code="null"
          @connect="onConnect"
          @connect-start="onConnectStart"
          @connect-end="onConnectEnd"
          @node-click="onNodeClick"
          @edge-click="onEdgeClick"
          @pane-click="onPaneClick"
          @node-context-menu="onNodeContextMenu"
          @edge-context-menu="onEdgeContextMenu"
          @pane-context-menu="onPaneContextMenu"
          class="vue-flow-canvas"
        >
          <DocumentTitle :document-name="currentFileName" v-if="isToolbarCollapsed"/>
          <Background pattern-color="#aaa" :gap="16" />
          <Controls>
            <template #default>
              <ControlButton
                :title="isLivePreviewVisible ? 'Hide live preview' : 'Show live preview'"
                @click="isLivePreviewVisible = !isLivePreviewVisible"
              >
                <svg v-if="isLivePreviewVisible" xmlns="http://www.w3.org/2000/svg"
                    width="16" height="16" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg"
                    width="16" height="16" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              </ControlButton>
            </template>
          </Controls>
        </VueFlow>

        <!-- Right-click menu, mirroring the sidebar options for whatever
             the click landed on -->
        <ContextMenu
          v-if="contextMenu.visible"
          :key="contextMenu.token"
          :x="contextMenu.x"
          :y="contextMenu.y"
          @close="closeContextMenu"
        >
          <NodeOptionsPanel
            v-if="contextMenu.target === 'node' && !isReadOnly"
            :colors="colors"
            :nodes="nodes"
            :selected-node-id="selectedNodeId"
            :selected-node-ids="selectedNodeIds"
            @duplicate="duplicateSelectedNodes"
            @update-color="updateNodeColor"
            @update-zindex="updateNodeZIndex"
            @lock-movement="lockNodePosition"
          />

          <ConnectorOptionsPanel
            v-else-if="contextMenu.target === 'edge' && !isReadOnly"
            :edge="getSelectedEdge"
            :direction-label="getEdgeDirectionLabel"
            @switch-direction="switchEdgeDirection"
            @update-label="updateEdgeLabel"
            @toggle-style="toggleEdgeStyle"
            @remove="removeConnectorFromMenu"
          />

          <template v-else>
            <h3 class="context-menu-title">Mindmap</h3>
            <button @click="addNodeFromMenu" class="btn primary" v-if="!isReadOnly">Add Node</button>
            <button @click="recenterMap" class="btn secondary">Re-center MindMap</button>
            <!-- Feature/read-only -->
            <button @click="toggleReadOnly" class="btn"
            :class="isReadOnly ? 'primary' : 'secondary'"
            >
              {{ isReadOnly ? 'Enable Editing':'Enable Read-Only' }}
            </button>
            <hr />
            <button @click="saveMindmap" class="btn secondary">Save</button>
            <button @click="saveAsMindmap" class="btn secondary">Save As</button>
            <button @click="loadMindmap" class="btn secondary">Load</button>
          </template>
        </ContextMenu>

        <LivePreviewPanel v-if="isLivePreviewVisible"/>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, watch, watchEffect, onMounted, markRaw, toRaw } from 'vue'
import { VueFlow, useVueFlow, ConnectionMode, MarkerType, isNode } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls,ControlButton } from '@vue-flow/controls'
import MindmapNode from './components/MindmapNode.vue'
import TopNavBar from './components/TopNavBar.vue'
import HelpPopover from './components/HelpPopover.vue'
import NodeOptionsPanel from './components/NodeOptionsPanel.vue'
import ConnectorOptionsPanel from './components/ConnectorOptionsPanel.vue'
import ContextMenu from './components/ContextMenu.vue'
import DocumentTitle from './components/DocumentTitle.vue'

import LeftSidebar from './components/LeftSidebar.vue'

// Import Vue Flow styles required for UI rendering
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import '@vue-flow/controls/dist/style.css'

//Feature/markdown-live-preview
import LivePreviewPanel from './components/LivePreviewPanel.vue'

//Feature/read-only
import { useReadOnly } from './composables/useReadOnly.js'

// REFACTOR/save-load-composable
import { useSaveLoad } from './composables/useSaveLoad.js'

//REFACTOR/Sidebar
import '../src/main.css'

const isToolbarCollapsed = ref(false)
const isConnecting = ref(false)
const selectedNodeId = ref(null)
const selectedEdgeId = ref(null)


//Feature/toggle-live-preview-visiblity
const isLivePreviewVisible = ref(true)

//Feature/read-only
const {isReadOnly,toggleReadOnly} = useReadOnly()

// Where the right-click menu is anchored and what it should offer.
// target is 'node' | 'edge' | 'pane', and flowPosition is the clicked spot
// in canvas coordinates (used to drop a new node under the cursor).
// token changes on every open so the menu remounts and re-measures itself.
const contextMenu = ref({ visible: false, x: 0, y: 0, target: 'pane', flowPosition: null, token: 0 })

// Remembers the last node the user clicked, so Ctrl+D still has a target
// after the selection has been cleared
const lastClickedNodeId = ref(null)

// Unique per-entity id. Date.now() collides when several nodes are cloned in
// the same tick, which would break a group duplicate. randomUUID needs a
// secure context, hence the counter fallback.
let idCounter = 0
const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  idCounter += 1
  return `node-${Date.now()}-${idCounter}`
}

const colors = ['#fffff0', '#8bbd88', '#e07163', '#6a8aeb', '#e6eb6a']

// 4 connection direction modes, cycled by the "Switch Connector Direction" button
const DIRECTION_MODES = ['none', 'forward', 'backward', 'both']
const directionLabels = {
  none: 'No Direction',
  forward: 'Source → Target',
  backward: 'Target → Source',
  both: 'Bidirectional',
}

const arrowColor = '#291e01'

const buildMarker = () => ({
  type: MarkerType.ArrowClosed,
  color: arrowColor,
  width: 18,
  height: 18,
})

// Connector stroke width (Vue Flow default is 1)
const edgeStyle = { strokeWidth: 2, stroke: '#291e01' }

const toggleToolbar = () => {
  isToolbarCollapsed.value = !isToolbarCollapsed.value
}

// Register custom node type
const nodeTypes = {
  mindmap: markRaw(MindmapNode),
}

// const savedState = localStorage.getItem('mindmap_state')
let initialNodes = [
  {
    id: '1',
    type: 'mindmap',
    position: { x: 250, y: 150 },
    style: { width: '160px', height: '160px' },
    data: { label: 'Central Idea', bgColor: '#fffff0' },
  },
  {
    id: '2',
    type: 'mindmap',
    position: { x: 450, y: 300 },
    style: { width: '160px', height: '160px' },
    data: { label: 'Explanation 1', bgColor: '#fffff0' },
  },
  {
    id: '3',
    type: 'mindmap',
    position: { x: 50, y: 300 },
    style: { width: '160px', height: '160px' },
    data: { label: 'Explanation 2', bgColor: '#fffff0' },
  },
]
let initialEdges = [
  { id: 'e1-2', source: '1', target: '2', sourceHandle: 'right', targetHandle: 'left', type: 'default', animated: false, style: { ...edgeStyle }, data: { dirMode: 0 } },
  { id: 'e1-3', source: '1', target: '3', sourceHandle: 'left', targetHandle: 'right', type: 'default', animated: false, style: { ...edgeStyle }, data: { dirMode: 0 } },
]


// DOC: Loads the data from the saved state
/*
if (savedState) {
  try {
    const parsed = JSON.parse(savedState)
    if (parsed.nodes) initialNodes = parsed.nodes
    if (parsed.edges) {
      initialEdges = parsed.edges.map(e => ({
        ...e,
        style: e.style || edgeStyle,
        markerStart: e.data?.dirMode === 2 || e.data?.dirMode === 3 ? buildMarker() : undefined,
        markerEnd: e.data?.dirMode === 1 || e.data?.dirMode === 3 ? buildMarker() : undefined,
      }))
    }
  } catch (e) {
    console.error('Failed to load saved mindmap state:', e)
  }
}
*/

const nodes = ref(initialNodes)
const edges = ref(initialEdges)

// DOC: Watches any changes here and writes to the local storage.
/*
watch([nodes, edges], () => {
  try {
    const state = {
      nodes: nodes.value,
      edges: edges.value,
    }
    localStorage.setItem('mindmap_state', JSON.stringify(state))
  } catch (e) {
    console.error('Failed to save mindmap state:', e)
  }
}, { deep: true })
*/

const { onConnect, addEdges, fitView, screenToFlowCoordinate } = useVueFlow()

const {
        currentFileHandle,
        saveStatus,
        saveTimer,
        executeSave,
        loadMindmap
} = useSaveLoad(nodes,edges,edgeStyle,buildMarker,selectedNodeId,selectedEdgeId)

const currentFileName = computed(() => {
  if (!currentFileHandle.value || !currentFileHandle.value.name) {
    return 'untitled*'
  }
  let name = currentFileHandle.value.name
  if (name.endsWith('.dmm.json')) {
    name = name.slice(0, -9)
  } else if (name.endsWith('.json')) {
    name = name.slice(0, -5)
  }
  return name
})

watchEffect(() => {
  document.title = `Mindmap Maker | ${currentFileName.value}`
})

onConnect((connection) => {
  if (connection.source === connection.target) return
  addEdges({ ...connection, type: 'default', animated: false, style: { ...edgeStyle }, data: { dirMode: 0 } })
})

const onConnectStart = () => {
  isConnecting.value = true
}

const onConnectEnd = () => {
  isConnecting.value = false
}

// A node and a connector can never both own the option panels
const selectNode = (id) => {
  selectedNodeId.value = id
  selectedEdgeId.value = null
  lastClickedNodeId.value = id
}

const selectEdge = (id) => {
  selectedEdgeId.value = id
  selectedNodeId.value = null
}

const onNodeClick = (event) => {
  selectNode(event.node.id)
}

const onEdgeClick = (event) => {
  selectEdge(event.edge.id)
}

const onPaneClick = () => {
  selectedNodeId.value = null
  selectedEdgeId.value = null
}

const closeContextMenu = () => {
  contextMenu.value.visible = false
}

const openContextMenu = (target, event) => {
  contextMenu.value = {
    visible: true,
    x: event.clientX,
    y: event.clientY,
    target,
    flowPosition: screenToFlowCoordinate({ x: event.clientX, y: event.clientY }),
    token: contextMenu.value.token + 1,
  }
}

// Right-clicking has to move the selection too, otherwise the menu would
// offer options for whatever was picked with the last left click
const onNodeContextMenu = ({ event, node }) => {
  event.preventDefault()
  if (!event.shiftKey) {
    nodes.value.forEach((n) => (n.selected = false))
    node.selected = true
  }
  selectNode(node.id)
  openContextMenu('node', event)
}

const onEdgeContextMenu = ({ event, edge }) => {
  event.preventDefault()
  selectEdge(edge.id)
  openContextMenu('edge', event)
}

const onPaneContextMenu = (event) => {
  event.preventDefault()
  onPaneClick()
  openContextMenu('pane', event)
}

// Adding a node from the menu puts it under the cursor rather than in the
// middle of the viewport
const addNodeFromMenu = () => {
  addNode(contextMenu.value.flowPosition)
  closeContextMenu()
}

const removeConnectorFromMenu = () => {
  deleteSelectedEdge()
  closeContextMenu()
}

// The subject of the menu can disappear while it is open (the Delete key, a
// reload), which would otherwise leave dead controls on screen
watch([selectedNodeId, selectedEdgeId], () => {
  if (!contextMenu.value.visible) return
  if (contextMenu.value.target === 'node' && !selectedNodeId.value) closeContextMenu()
  if (contextMenu.value.target === 'edge' && !selectedEdgeId.value) closeContextMenu()
})

const getSelectedEdge = computed(() => edges.value.find((e) => e.id === selectedEdgeId.value) || null)

// Every node currently selected on the canvas, whether picked by a single
// click or by a box/shift selection
const selectedNodeIds = computed(() => nodes.value.filter((n) => n.selected).map((n) => n.id))

// A box selection leaves selectedNodeId empty (there is no single active node),
// so the panel has to key off the selection as a whole
const hasNodeSelection = computed(() => selectedNodeIds.value.length > 0 || !!selectedNodeId.value)

const getEdgeDirectionLabel = computed(() => {
  const edge = getSelectedEdge.value
  if (!edge) return ''
  return directionLabels[DIRECTION_MODES[edge.data?.dirMode ?? 0]]
})

const applyDirection = (edge, mode) => {
  if (!edge.data) edge.data = {}
  edge.data.dirMode = mode
  edge.markerStart = mode === 2 || mode === 3 ? buildMarker() : undefined
  edge.markerEnd = mode === 1 || mode === 3 ? buildMarker() : undefined
}

const switchEdgeDirection = () => {
  const edge = getSelectedEdge.value
  if (!edge) return
  const next = ((edge.data?.dirMode ?? 0) + 1) % 4
  applyDirection(edge, next)
}

const updateEdgeLabel = (value) => {
  const edge = getSelectedEdge.value
  if (!edge) return
  if (!edge.data) edge.data = {}
  edge.data.label = value
  // Vue Flow renders edge labels from the top-level `label` prop
  edge.label = value || undefined
}

const toggleEdgeStyle = () => {
  const edge = getSelectedEdge.value
  if (!edge) return

  const currentStyle = edge.style ? { ...edge.style } : { ...edgeStyle }

  if (currentStyle.strokeDasharray) {
    delete currentStyle.strokeDasharray
  } else {
    currentStyle.strokeDasharray = '6 6'
  }

  edge.style = currentStyle
}

const updateNodeColor = (color) => {
  if (!selectedNodeId.value) return
  const node = nodes.value.find((n) => n.id === selectedNodeId.value)
  if (node) {
    if (!node.data) node.data = {}
    node.data.bgColor = color
  }
}

// Feature/node-movement-lock
const lockNodePosition = () => {
  if (!selectedNodeId.value) return
  const node = nodes.value.find((n) => n.id === selectedNodeId.value)
  if (node) {
    // if (!node.draggable) {node.draggable = false; return}
    // console.log('here')

    // At the beginning, the draggable will be undefined so that will be treated as false.
    node.draggable = node.draggable === false

    // The following 2 lines are here to pass this "draggable" info into the data object to be used elsewhere as props.
    if (!node.data) node.data = {}
    node.data.draggable = node.draggable === false
  }
}

const updateNodeZIndex = (zIndex) => {
  if (!selectedNodeId.value) return
  const node = nodes.value.find((n) => n.id === selectedNodeId.value)
  if (node) {
    const value = Number.isFinite(zIndex) ? Math.floor(zIndex) : 0
    node.zIndex = value
    if (!node.data) node.data = {}
    node.data.zIndex = value
    if (!node.style) node.style = {}
    node.style.zIndex = value
  }
}

// anchorPosition is the canvas point to centre the new node on. When it is
// omitted the node spawns in the middle of the current (panned/zoomed)
// viewport instead
const addNode = (anchorPosition = null) => {
  const newId = String(Date.now())

  let center = anchorPosition
  if (!center) {
    const el = document.querySelector('.vue-flow__renderer')
    if (el) {
      const rect = el.getBoundingClientRect()
      center = screenToFlowCoordinate({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      })
    }
  }

  let position
  if (center) {
    // node position is its top-left, so offset by half the node size to centre it
    position = { x: center.x - 80, y: center.y - 80 }
  } else {
    position = { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 }
  }

  nodes.value.push({
    id: newId,
    type: 'mindmap',
    position,
    style: { width: '160px', height: '160px', zIndex: 0 },
    zIndex: 0,
    data: { label: `Node ${nodes.value.length + 1}`, bgColor: '#fffff0', zIndex: 0 },
  })

  selectedNodeId.value = newId
  selectedEdgeId.value = null
}

// Uniform offset applied to every cloned node, so a group duplicate keeps its
// internal layout and can be dragged around as one unit
const DUPLICATE_OFFSET = 180

// Rebuild the arrow markers from the stored direction mode, matching what
// loadMindmap does when reading a file back
const edgeMarkersFor = (edge) => ({
  markerStart: edge.data?.dirMode === 2 || edge.data?.dirMode === 3 ? buildMarker() : undefined,
  markerEnd: edge.data?.dirMode === 1 || edge.data?.dirMode === 3 ? buildMarker() : undefined,
})

// Clones the given nodes plus only those connectors whose source AND target
// are both inside the set, so the result is a self-contained mini mindmap
const duplicateNodes = (ids) => {
  const sourceIdSet = new Set(ids)
  if (sourceIdSet.size === 0) return

  const idMap = new Map()
  const clonedNodes = []

  nodes.value.forEach((node) => {
    if (!sourceIdSet.has(node.id)) return

    const rawNode = toRaw(node)
    const { dimensions, handleBounds, computedPosition, selected, dragging, ...cleanNode } = rawNode

    const newId = generateId()
    idMap.set(node.id, newId)

    clonedNodes.push({
      ...cleanNode,
      id: newId,
      selected: true,
      position: {
        x: rawNode.position.x + DUPLICATE_OFFSET,
        y: rawNode.position.y + DUPLICATE_OFFSET,
      },
      zIndex: rawNode.data?.zIndex ?? rawNode.zIndex ?? 0,
      data: rawNode.data ? { ...rawNode.data, zIndex: rawNode.data?.zIndex ?? rawNode.zIndex ?? 0 } : { zIndex: 0 },
      style: rawNode.style ? { ...rawNode.style, zIndex: rawNode.data?.zIndex ?? rawNode.zIndex ?? rawNode.style?.zIndex ?? 0 } : { zIndex: rawNode.data?.zIndex ?? rawNode.zIndex ?? 0 },
    })
  })

  if (clonedNodes.length === 0) return

  const clonedEdges = edges.value
    .filter((edge) => sourceIdSet.has(edge.source) && sourceIdSet.has(edge.target))
    .map((edge) => {
      const rawEdge = toRaw(edge)
      const { selected, ...cleanEdge } = rawEdge

      return {
        ...cleanEdge,
        ...edgeMarkersFor(rawEdge),
        id: generateId(),
        source: idMap.get(rawEdge.source),
        target: idMap.get(rawEdge.target),
        style: rawEdge.style ? { ...rawEdge.style } : { ...edgeStyle },
        data: rawEdge.data ? { ...rawEdge.data } : {},
      }
    })

  // Deselect the originals so dragging a clone does not drag both copies
  nodes.value.forEach((node) => {
    if (sourceIdSet.has(node.id)) node.selected = false
  })

  nodes.value.push(...clonedNodes)
  edges.value.push(...clonedEdges)

  selectedEdgeId.value = null

  // A lone clone stays the active node so the Node Options panel keeps
  // working; a group has no single active node
  selectedNodeId.value = clonedNodes.length === 1 ? clonedNodes[0].id : null
}

// Resolves what Ctrl+D and the sidebar Duplicate button act on: the
// box/shift selection first, then the active node, then whatever was clicked
// most recently
const duplicateSelectedNodes = () => {
  if (selectedNodeIds.value.length > 0) return duplicateNodes(selectedNodeIds.value)
  if (selectedNodeId.value) return duplicateNodes([selectedNodeId.value])
  if (lastClickedNodeId.value) return duplicateNodes([lastClickedNodeId.value])
}

const deleteNode = (id) => {
  nodes.value = nodes.value.filter((n) => n.id !== id)
  const removed = edges.value.filter((e) => e.source === id || e.target === id)
  edges.value = edges.value.filter((e) => e.source !== id && e.target !== id)
  if (selectedNodeId.value === id) {
    selectedNodeId.value = null
  }
  if (removed.some((e) => e.id === selectedEdgeId.value)) {
    selectedEdgeId.value = null
  }
}

const deleteSelectedEdge = () => {
  if (!selectedEdgeId.value) return
  edges.value = edges.value.filter((e) => e.id !== selectedEdgeId.value)
  selectedEdgeId.value = null
}

const saveAsMindmap = () => executeSave(true)

const saveMindmap = () => executeSave(false)

const recenterMap = () => {
  fitView({ padding: 0.2, duration: 800 })
}

onMounted(() => {
  window.addEventListener('delete-node', (e) => {
    deleteNode(e.detail)
  })

  // Automatically dismiss stray connection lines on mouse/pointer release if dropped outside a handle
  window.addEventListener('pointerup', (e) => {
    if (isConnecting.value) {
      const isOverHandle = e.target.closest('.vue-flow__handle')
      if (!isOverHandle) {
        const pane = document.querySelector('.vue-flow__pane')
        if (pane) {
          pane.click()
        }
      }
      isConnecting.value = false
    }
  })

  // Keyboard shortcuts for delete (nodes/connectors) and app hotkeys
  window.addEventListener('keydown', (e) => {
    const target = e.target
    const isInInput = target instanceof HTMLElement && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
    const isNodeEditor = target instanceof HTMLElement && target.closest('.custom-mindmap-node') !== null

    // App hotkeys (Ctrl on Windows/Linux, Cmd on macOS)
    if (e.ctrlKey || e.metaKey) {
      const key = e.key.toLowerCase()

      if (key === 's') {
        e.preventDefault()
        saveMindmap()
        return
      }

      if (key === 'o') {
        e.preventDefault()
        loadMindmap()
        return
      }

      // Guarded: Ctrl+A means "select all text" inside a textarea, so the
      // native behaviour has to survive while editing
      if (key === 'a' && !isInInput) {
        e.preventDefault()
        addNode()
        return
      }

      // Unguarded: Ctrl+D has no native text meaning, so it would otherwise
      // fall through and trigger the browser bookmark even while editing
      if (key === 'd') {
        e.preventDefault()
        duplicateSelectedNodes()
        return
      }

      return
    }

    // Single key shortcuts when not typing in inputs
    if (!isInInput) {
      const lowerKey = e.key.toLowerCase()
      if (lowerKey === 'd' && selectedEdgeId.value) {
        e.preventDefault()
        switchEdgeDirection()
        return
      }
      if (lowerKey === 's' && selectedEdgeId.value) {
        e.preventDefault()
        toggleEdgeStyle()
        return
      }
    }

    // Escape key: deselect nodes and edges
    if (e.key === 'Escape') {
      e.preventDefault()

      if (isNodeEditor && target instanceof HTMLElement)
      {
        target.blur()
      }

      selectedNodeId.value = null
      selectedEdgeId.value = null
      nodes.value.forEach((n) => (n.selected = false))
      return
    }

    // Delete key binding
    if (e.key === 'Delete') {
      if (isInInput && !isNodeEditor) return

      if (selectedEdgeId.value) {
        e.preventDefault()
        deleteSelectedEdge()
        return
      }

      const selectedNodes = nodes.value.filter((n) => n.selected)
      if (selectedNodes.length > 0 && !isNodeEditor) {
        e.preventDefault()
        selectedNodes.forEach((n) => deleteNode(n.id))
        return
      }

      if (selectedNodeId.value && !isNodeEditor) {
        e.preventDefault()
        deleteNode(selectedNodeId.value)
        return
      }
    }

    // Feature/toggle-toolbar: Added the hotkey 'T' for toggling the toolbar
    if (e.key === 't' || e.key === 'T') {
      if (isInInput) return
      e.preventDefault()
      toggleToolbar()
      return
    }
  })
})
</script>

<style>
.mindmap-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}
</style>
