<template>
    <aside class="sidebar" :class="{ collapsed: props.isToolbarCollapsed }">
        <div class="sidebar-header">
          <button @click="emit('toggle-toolbar')" class="hamburger-btn" title="Toggle Toolbar">
            ☰
          </button>
          <div class="header-titles" v-if="!props.isToolbarCollapsed">
            <div class="title-row">
              <h3 class="current-file-name" :title="props.currentFileName">{{ props.currentFileName }}</h3>
              <HelpPopover>
                <small>Drag from any pin (top, bottom, left, right) to another pin to create precise solid connections. Click a node to edit markdown/LaTeX or change its color. Shift-LeftClick & Drag to select multiple nodes. Right-click a node, a connector, or the canvas to get the same options as this toolbar.</small>
                <div class="help-shortcuts">
                  <small><strong>Ctrl+A</strong> add node &middot; <strong>Ctrl+D</strong> duplicate &middot; <strong>Ctrl+S</strong> save &middot; <strong>Ctrl+O</strong> open &middot; <strong>D</strong> edge direction &middot; <strong>S</strong> edge style &middot; <strong>Esc</strong> deselect current node &middot; <strong>T</strong> Toggle this toolbar
                  </small>
                </div>
              </HelpPopover>
              
              <HelpPopover icon="🛈">
                <small>Mindmap Information</small>
                <hr>
                <span>Nodes: {{ props.nodes.length }}</span> | <span>Connections: {{ props.edges.length }}</span>
                <hr>
                <span><strong>Current File Name:</strong> {{ props.currentFileName }}</span>
              </HelpPopover>
            </div>
          </div>
        </div>

        <div class="sidebar-body" v-if="!props.isToolbarCollapsed">
          <button @click="emit('add-node')" class="btn primary" v-if="!isReadOnly">Add Node</button>
          <button @click="emit('recenter-mindmap')" class="btn secondary">Re-center MindMap</button>
          <!-- Feature/read-only -->
          <button @click="emit('toggle-readonly')" class="btn"
          :class="props.isReadOnly ? 'primary' : 'secondary'"
          >
            {{ props.isReadOnly ? 'Enable Editing':'Enable Read-Only' }}
          </button>

          <!-- Node Options (Shows up when one or more nodes are selected) -->
          <NodeOptionsPanel
            v-if="hasNodeSelection && !isReadOnly"
            :colors="colors"
            :nodes="nodes"
            :selected-node-id="selectedNodeId"
            :selected-node-ids="selectedNodeIds"
            @duplicate="emit('duplicate')"
            @update-color="(color) => emit('update-color', color)"
            @update-zindex="(zIndex) => emit('update-zindex', zIndex)"
            @lock-movement="emit('lock-movement')"
        />

          <!-- Connector Direction (Shows up when a connector is selected) -->
          <ConnectorOptionsPanel
            v-if="selectedEdgeId && !isReadOnly"
            :edge="edge"
            :direction-label="directionLabel"
            @switch-direction="emit('switch-direction')"
            @update-label="(value) => emit('update-label', value)"
            @toggle-style="emit('toggle-style')"
            @remove="emit('remove-edge')"
        />
        </div>

        <div class="toolbar-actions" v-if="!isToolbarCollapsed">
          <button @click="emit('save-mindmap')" class="btn action-btn">Save</button>
          <button @click="emit('save-as-mindmap')" class="btn action-btn">Save As</button>
          <button @click="emit('load-mindmap')" class="btn action-btn">Load</button>
        </div>
      </aside>
</template>

<script setup>
import NodeOptionsPanel from "./NodeOptionsPanel.vue";
import ConnectorOptionsPanel from "./ConnectorOptionsPanel.vue";
import HelpPopover from "./HelpPopover.vue";
import "../../src/main.css"

const props = defineProps({
    isToolbarCollapsed:{
        type:Boolean,
        required:true,
    },
    currentFileName:{
        type:String,
        required:true
    },
    nodes:{
        type:Object,
        required:true
    },
    edges:{
        type:Object,
        required:true
    },
    isReadOnly:{
        type:Boolean,
        required:true
    },

    // Node Options Related
    colors: { type: Array, required: true },
    selectedNodeId: { type: [String, Number], default: null },
    selectedNodeIds: { type: Array, default: () => [] },
    hasNodeSelection: { type: Boolean, required: true },

    //Connector Options Related
    edge: { type: Object, default: null },
    directionLabel: { type: String, default: '' },
    selectedEdgeId : { type: [String, Number], default: null },
    
})

const emit = defineEmits([
  'toggle-toolbar',
  'save-mindmap',
  'save-as-mindmap',
  'load-mindmap',
  'add-node',
  'recenter-mindmap',
  'toggle-readonly',
  // relayed from NodeOptionsPanel
  'duplicate',
  'update-color',
  'update-zindex',
  'lock-movement',
  // relayed from ConnectorOptionsPanel
  'switch-direction',
  'update-label',
  'toggle-style',
  'remove-edge',
])
</script>

<style>
</style>