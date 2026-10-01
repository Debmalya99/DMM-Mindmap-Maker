<template>
  <div class="mindmap-container">
    <main class="main-content">
      <!-- Collapsible Sidebar / Toolbar -->
      <aside class="sidebar" :class="{ collapsed: isToolbarCollapsed }">
        <div class="sidebar-header">
          <button @click="toggleToolbar" class="hamburger-btn" title="Toggle Toolbar">
            ☰
          </button>
          <div class="header-titles" v-if="!isToolbarCollapsed">
            <div class="title-row">
              <h2>Toolbar</h2>
              <div class="help-tooltip-container">
                <span class="help-icon" title="Help & Tips">💡</span>
                <div class="help-popover">
                  <small>Drag from any pin (top, bottom, left, right) to another pin to create precise solid connections. Click a node to edit markdown/LaTeX or change its color. Shift-LeftClick & Drag to select multiple nodes.</small>
                  <div class="help-shortcuts">
                    <small><strong>Ctrl+A</strong> add node &middot; <strong>Ctrl+S</strong> save &middot; <strong>Ctrl+O</strong> open</small>
                  </div>
                </div>
              </div>
            </div>
            <div class="current-file-name">{{ currentFileName }}</div>
          </div>
        </div>

        <div class="sidebar-body" v-if="!isToolbarCollapsed">
          <button @click="addNode" class="btn primary">Add Node</button>
          <button @click="recenterMap" class="btn secondary">Re-center MindMap</button>

          <!-- Color Palette (Shows up when a node is selected) -->
          <div class="color-palette-section" v-if="selectedNodeId">
            <h3>Node Options</h3>
            <button @click="duplicateNode(selectedNodeId)" class="btn secondary">Duplicate Node</button>
            <h3>Node Color</h3>
            <div class="color-grid">
              <button
                v-for="color in colors"
                :key="color"
                class="color-swatch"
                :style="{ backgroundColor: color }"
                :class="{ active: getNodeColor(selectedNodeId) === color }"
                @click="updateNodeColor(color)"
                :title="color"
              ></button>
            </div>
            <div class="custom-color-picker-row">
              <label for="custom-node-color">Custom Color:</label>
              <input
                id="custom-node-color"
                type="color"
                class="color-picker-input"
                :value="getNodeColor(selectedNodeId)"
                @input="(e) => updateNodeColor(e.target.value)"
              />
            </div>
          </div>

          <!-- Connector Direction (Shows up when a connector is selected) -->
          <div class="direction-section" v-if="selectedEdgeId">
            <h3>Connector Options</h3>
            <button @click="switchEdgeDirection" class="btn secondary">Switch Connector Direction</button>
            <div class="direction-current">
              Current: <strong>{{ getEdgeDirectionLabel }}</strong>
            </div>
            <input
              type="text"
              class="edge-label-input"
              placeholder="Connector label (optional)"
              :value="getSelectedEdge?.data?.label || ''"
              @input="updateEdgeLabel"
            />
            <button @click="toggleEdgeStyle" class="btn secondary">Toggle Style</button>
            <button @click="deleteSelectedEdge" class="btn danger">Remove Connector</button>  
          </div>
        </div>

        <div class="toolbar-actions" v-if="!isToolbarCollapsed">
          <button @click="saveMindmap" class="btn action-btn">Save</button>
          <button @click="saveAsMindmap" class="btn action-btn">Save As</button>
          <button @click="loadMindmap" class="btn action-btn">Load</button>
        </div>

        <div class="toolbar-footer" v-if="!isToolbarCollapsed">
          <span>Nodes: {{ nodes.length }}</span> | <span>Connections: {{ edges.length }}</span>
        </div>
      </aside>

      <section class="canvas-area">
        <VueFlow
          v-model:nodes="nodes"
          v-model:edges="edges"
          :node-types="nodeTypes"
          :connection-mode="ConnectionMode.Loose"
          @connect="onConnect"
          @connect-start="onConnectStart"
          @connect-end="onConnectEnd"
          @node-click="onNodeClick"
          @edge-click="onEdgeClick"
          @pane-click="onPaneClick"
          class="vue-flow-canvas"
        >
          <Background pattern-color="#aaa" :gap="16" />
          <Controls />
        </VueFlow>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, watch, watchEffect, onMounted, markRaw, toRaw } from 'vue'
import { VueFlow, useVueFlow, ConnectionMode, MarkerType } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import MindmapNode from './components/MindmapNode.vue'

// Import Vue Flow styles required for UI rendering
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import '@vue-flow/controls/dist/style.css'

const isToolbarCollapsed = ref(false)
const isConnecting = ref(false)
const selectedNodeId = ref(null)
const selectedEdgeId = ref(null)
const currentFileHandle = ref(null)

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

const onNodeClick = (event) => {
  selectedNodeId.value = event.node.id
  selectedEdgeId.value = null
}

const onEdgeClick = (event) => {
  selectedEdgeId.value = event.edge.id
  selectedNodeId.value = null
}

const onPaneClick = () => {
  selectedNodeId.value = null
  selectedEdgeId.value = null
}

const getSelectedEdge = computed(() => edges.value.find((e) => e.id === selectedEdgeId.value) || null)

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

const updateEdgeLabel = (event) => {
  const edge = getSelectedEdge.value
  if (!edge) return
  if (!edge.data) edge.data = {}
  const value = event.target.value
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

const getNodeColor = (id) => {
  const node = nodes.value.find((n) => n.id === id)
  return node?.data?.bgColor || '#fffff0'
}

const updateNodeColor = (color) => {
  if (!selectedNodeId.value) return
  const node = nodes.value.find((n) => n.id === selectedNodeId.value)
  if (node) {
    if (!node.data) node.data = {}
    node.data.bgColor = color
  }
}

const addNode = () => {
  const newId = String(Date.now())

  // Spawn at the centre of the current (panned/zoomed) viewport
  const el = document.querySelector('.vue-flow__renderer')
  let position
  if (el) {
    const rect = el.getBoundingClientRect()
    const flowPos = screenToFlowCoordinate({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    })
    // node position is its top-left, so offset by half the node size to centre it
    position = { x: flowPos.x - 80, y: flowPos.y - 80 }
  } else {
    position = { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 }
  }

  nodes.value.push({
    id: newId,
    type: 'mindmap',
    position,
    style: { width: '160px', height: '160px' },
    data: { label: `Node ${nodes.value.length + 1}`, bgColor: '#fffff0' },
  })

  selectedNodeId.value = newId
  selectedEdgeId.value = null
}

const duplicateNode = (id) => {
  const source = nodes.value.find((n) => n.id === id)
  if (!source) return

  const newId = String(Date.now())
  const offset = 180

  const rawSource = toRaw(source)
  const { dimensions, handleBounds, computedPosition, selected, dragging, ...cleanSource } = rawSource

  const clonedNode = {
    ...cleanSource,
    id: newId,
    position: {
      x: rawSource.position.x + offset,
      y: rawSource.position.y + offset,
    },
    data: rawSource.data ? { ...rawSource.data } : {},
    style: rawSource.style ? { ...rawSource.style } : {},
  }

  nodes.value.push(clonedNode)

  // Duplicate starts unconnected, so no edges are copied
  selectedNodeId.value = newId
  selectedEdgeId.value = null
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

const saveAsMindmap = async () => {
  if (!window.showSaveFilePicker) {
    alert('File System Access API is not supported in this browser.')
    return
  }
  try {
    const handle = await window.showSaveFilePicker({
      types: [
        {
          description: 'Mindmap Files (.dmm.json)',
          accept: { 'application/json': ['.dmm.json'] },
        },
      ],
    })
    currentFileHandle.value = handle
    const writable = await handle.createWritable()
    const state = {
      nodes: toRaw(nodes.value),
      edges: toRaw(edges.value),
    }
    await writable.write(JSON.stringify(state, null, 2))
    await writable.close()
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.error('Failed to save as mindmap:', err)
      alert('Failed to save mindmap file.')
    }
  }
}

const saveMindmap = async () => {
  if (!currentFileHandle.value) {
    await saveAsMindmap()
    return
  }
  try {
    const writable = await currentFileHandle.value.createWritable()
    const state = {
      nodes: toRaw(nodes.value),
      edges: toRaw(edges.value),
    }
    await writable.write(JSON.stringify(state, null, 2))
    await writable.close()
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.error('Failed to save mindmap in place:', err)
      await saveAsMindmap()
    }
  }
}

const loadMindmap = async () => {
  if (!window.showOpenFilePicker) {
    alert('File System Access API is not supported in this browser.')
    return
  }
  try {
    const [handle] = await window.showOpenFilePicker({
      types: [
        {
          description: 'Mindmap Files (.dmm.json, .json)',
          accept: { 'application/json': ['.dmm.json', '.json'] },
        },
      ],
      multiple: false,
    })
    currentFileHandle.value = handle
    const file = await handle.getFile()
    const content = await file.text()
    const parsed = JSON.parse(content)

    if (parsed.nodes) {
      nodes.value = parsed.nodes
    }
    if (parsed.edges) {
      edges.value = parsed.edges.map((e) => ({
        ...e,
        style: e.style || edgeStyle,
        markerStart: e.data?.dirMode === 2 || e.data?.dirMode === 3 ? buildMarker() : undefined,
        markerEnd: e.data?.dirMode === 1 || e.data?.dirMode === 3 ? buildMarker() : undefined,
      }))
    }
    selectedNodeId.value = null
    selectedEdgeId.value = null
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.error('Failed to load mindmap:', err)
      alert('Failed to load mindmap file.')
    }
  }
}

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

      // Suppressed while typing so native select-all keeps working in editors
      if (key === 'a' && !isInInput) {
        e.preventDefault()
        addNode()
        return
      }

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
  })
})
</script>

<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  background-color: #f4f7f6;
  color: #333;
}

.mindmap-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.sidebar {
  width: 260px;
  background: white;
  border-right: 1px solid #e0e0e0;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  z-index: 10;
  transition: width 0.3s ease, padding 0.3s ease;
}

.sidebar.collapsed {
  width: 70px;
  padding: 1.5rem 0.75rem;
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-titles {
  display: flex;
  flex-direction: column;
}

.current-file-name {
  font-style: italic;
  font-size: 0.85rem;
  color: #666;
  margin-top: 2px;
}

.sidebar.collapsed .sidebar-header {
  justify-content: center;
}

.hamburger-btn {
  background: #f0f2f5;
  border: 1px solid #d0d7de;
  border-radius: 4px;
  width: 36px;
  height: 36px;
  font-size: 1.2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2c3e50;
  transition: background 0.2s;
}

.hamburger-btn:hover {
  background: #e1e4e8;
}

.sidebar h2 {
  font-size: 1.2rem;
  color: #2c3e50;
}

.sidebar-body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  flex: 1;
}

.btn {
  padding: 0.6rem 1rem;
  border: none;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn.primary {
  background: #42b883;
  color: white;
}

.btn.primary:hover {
  background: #3aa876;
}

.btn.secondary {
  background: #e0e0e0;
  color: #333;
}

.btn.secondary:hover {
  background: #d0d0d0;
}

.btn.danger {
  background: #e07163;
  color: white;
}

.btn.danger:hover {
  background: #cf6052;
}

/* Color Palette styles */
.color-palette-section {
  background: #f9fbfb;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.color-palette-section h3 {
  font-size: 0.9rem;
  color: #2c3e50;
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
}

.color-swatch {
  width: 28px;
  height: 28px;
  border: 2px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
  transition: transform 0.2s, border-color 0.2s;
}

.color-swatch:hover {
  transform: scale(1.1);
  border-color: #42b883;
}

.color-swatch.active {
  border-color: #2c3e50;
  box-shadow: 0 0 0 2px #42b883;
}

/* Connector Direction section styles */
.direction-section {
  background: #f9fbfb;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.direction-section h3 {
  font-size: 0.9rem;
  color: #2c3e50;
}

.direction-current {
  font-size: 0.8rem;
  color: #666;
  text-align: center;
}

.edge-label-input {
  width: 100%;
  padding: 0.4rem 0.6rem;
  font-size: 0.85rem;
  font-family: inherit;
  color: #2c3e50;
  background: white;
  border: 1px solid #d0d0d0;
  border-radius: 4px;
}

.edge-label-input:focus {
  outline: none;
  border-color: #2c3e50;
}

/* Keep rendered connector labels small and legible */
.vue-flow__edge-textbg {
  fill: #f5f1eb;
}

.vue-flow__edge-text {
  font-size: 20px;
  fill: #2c3e50;
}

.title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.help-tooltip-container {
  position: relative;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
}

.help-icon {
  font-size: 1.1rem;
  padding: 2px 6px;
  border-radius: 50%;
  transition: background 0.2s;
}

.help-icon:hover {
  background: #f0f2f5;
}

.help-popover {
  visibility: hidden;
  opacity: 0;
  position: absolute;
  left: 30px;
  top: 0;
  width: 240px;
  background: white;
  color: #333;
  padding: 0.8rem;
  border-radius: 6px;
  border: 1px solid #d0d7de;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  z-index: 100;
  transition: opacity 0.2s ease, visibility 0.2s ease;
  font-size: 0.8rem;
  line-height: 1.4;
}

.help-tooltip-container:hover .help-popover {
  visibility: visible;
  opacity: 1;
}

.help-shortcuts {
  margin-top: 0.6rem;
  padding-top: 0.5rem;
  border-top: 1px solid #e8e8e8;
  color: #555;
}

.help-shortcuts strong {
  color: #247ad1;
  font-weight: 600;
}

.toolbar-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: auto;
  padding-top: 0.75rem;
}

.toolbar-actions .action-btn {
  flex: 1;
  background: #247ad1;
  color: white;
}

.toolbar-actions .action-btn:hover {
  background: #1f68b3;
}

.toolbar-footer {
  font-size: 0.85rem;
  color: #555;
  text-align: center;
  padding-top: 0.5rem;
  border-top: 1px solid #eee;
  white-space: nowrap;
}

.canvas-area {
  flex: 1;
  background: #f5f1eb;
  position: relative;
}

.vue-flow-canvas {
  width: 100%;
  height: 100%;
}

/* Remove Vue Flow selection outline and resizer border */
.vue-flow__node.selected {
  border: none !important;
  box-shadow: none !important;
  outline: none !important;
}

.vue-flow__node-resizer {
  border-color: transparent !important;
}

.vue-flow__node-resizer line {
  stroke: transparent !important;
}

.custom-color-picker-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 0.85rem;
  color: #2c3e50;
}

.color-picker-input {
  -webkit-appearance: none;
  border: none;
  width: 36px;
  height: 28px;
  border-radius: 4px;
  cursor: pointer;
  background: transparent;
}

.color-picker-input::-webkit-color-swatch-wrapper {
  padding: 0;
}

.color-picker-input::-webkit-color-swatch {
  border: 1px solid #ccc;
  border-radius: 4px;
}
</style>
