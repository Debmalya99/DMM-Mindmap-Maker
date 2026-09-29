<template>
  <div class="mindmap-container">
    <main class="main-content">
      <!-- Collapsible Sidebar / Toolbar -->
      <aside class="sidebar" :class="{ collapsed: isToolbarCollapsed }">
        <div class="sidebar-header">
          <button @click="toggleToolbar" class="hamburger-btn" title="Toggle Toolbar">
            ☰
          </button>
          <h2 v-if="!isToolbarCollapsed">Toolbar</h2>
        </div>

        <div class="sidebar-body" v-if="!isToolbarCollapsed">
          <button @click="addNode" class="btn primary">Add Node</button>
          <button @click="recenterMap" class="btn secondary">Re-center MindMap</button>

          <!-- Color Palette (Shows up when a node is selected) -->
          <div class="color-palette-section" v-if="selectedNodeId">
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
          

          <div class="help-text">
            <small>💡 Drag from any pin (top, bottom, left, right) to another pin to create precise solid Bezier connections. Click a node to edit markdown/LaTeX or change its color.
              Press ctrl-d on the keyboard to duplicate any selected node.
            </small>
          </div>
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
import { ref, computed, watch, onMounted, markRaw } from 'vue'
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

const colors = ['#ffffff', '#8bbd88', '#e07163', '#6a8aeb', '#e6eb6a']

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

const savedState = localStorage.getItem('mindmap_state')
let initialNodes = [
  {
    id: '1',
    type: 'mindmap',
    position: { x: 250, y: 150 },
    style: { width: '160px', height: '160px' },
    data: { label: 'Central Idea', bgColor: '#ffffff' },
  },
  {
    id: '2',
    type: 'mindmap',
    position: { x: 50, y: 300 },
    style: { width: '160px', height: '160px' },
    data: { label: 'Branch 1', bgColor: '#ffffff' },
  },
  {
    id: '3',
    type: 'mindmap',
    position: { x: 450, y: 300 },
    style: { width: '160px', height: '160px' },
    data: { label: 'Branch 2', bgColor: '#ffffff' },
  },
]
let initialEdges = [
  { id: 'e1-2', source: '1', target: '2', sourceHandle: 'right', targetHandle: 'left', type: 'default', animated: false, style: edgeStyle, data: { dirMode: 0 } },
  { id: 'e1-3', source: '1', target: '3', sourceHandle: 'left', targetHandle: 'right', type: 'default', animated: false, style: edgeStyle, data: { dirMode: 0 } },
]

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

const nodes = ref(initialNodes)
const edges = ref(initialEdges)

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

const { onConnect, addEdges, fitView, screenToFlowCoordinate } = useVueFlow()

onConnect((connection) => {
  if (connection.source === connection.target) return
  addEdges({ ...connection, type: 'default', animated: false, style: edgeStyle, data: { dirMode: 0 } })
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
  if (!edge.style) edge.style = { ...edgeStyle }

  if (edge.style.strokeDasharray) {
    delete edge.style.strokeDasharray
  } else {
    edge.style.strokeDasharray = '6 6'
  }
}

const getNodeColor = (id) => {
  const node = nodes.value.find((n) => n.id === id)
  return node?.data?.bgColor || '#ffffff'
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
    data: { label: `Node ${nodes.value.length + 1}`, bgColor: '#ffffff' },
  })

  selectedNodeId.value = newId
  selectedEdgeId.value = null
}

const duplicateNode = (id) => {
  const source = nodes.value.find((n) => n.id === id)
  if (!source) return

  const newId = String(Date.now())
  const offset = 180

  nodes.value.push({
    ...source,
    id: newId,
    position: { x: source.position.x + offset, y: source.position.y + offset },
    data: { ...source.data },
    style: { ...source.style },
  })

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

  // Keyboard shortcuts for delete (nodes/connectors) and duplicate (nodes)
  window.addEventListener('keydown', (e) => {
    const target = e.target
    const isInInput = target instanceof HTMLElement && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
    const isNodeEditor = target instanceof HTMLElement && target.closest('.custom-mindmap-node') !== null

    // Delete / Backspace
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (isInInput && !isNodeEditor) return

      if (selectedEdgeId.value) {
        e.preventDefault()
        deleteSelectedEdge()
        return
      }
      if (selectedNodeId.value && !isNodeEditor) {
        e.preventDefault()
        deleteNode(selectedNodeId.value)
        return
      }
    }

    // Ctrl/Cmd + D duplicates the currently selected node
    if (!e.ctrlKey && !e.metaKey) return
    if (e.key.toLowerCase() !== 'd') return
    if (!selectedNodeId.value) return

    if (target instanceof HTMLElement) {
      if (!isNodeEditor) {
        const tag = target.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable) return
      }
    }

    e.preventDefault()
    duplicateNode(selectedNodeId.value)
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
  font-size: 10px;
  fill: #2c3e50;
}

.help-text {
  margin-top: 1rem;
  font-size: 0.8rem;
  color: #888;
  line-height: 1.4;
  background: #f9fbfb;
  padding: 0.8rem;
  border-radius: 6px;
  border: 1px solid #eee;
}

.toolbar-footer {
  margin-top: auto;
  font-size: 0.85rem;
  color: #555;
  text-align: center;
  padding-top: 0.75rem;
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
</style>
