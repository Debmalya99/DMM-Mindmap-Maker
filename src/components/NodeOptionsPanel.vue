<template>
  <div class="color-palette-section">
    <h3>Node Options</h3>
    <button @click="$emit('duplicate')" class="btn secondary">{{ duplicateButtonLabel }}</button>
    <!-- Feature/node-movement-lock -->
    <button v-if="selectedNodeId"
    @click="$emit('lock-movement')" class="btn secondary"
    title="Lock/Unlock a Node's Position"
    >{{toggleNodeLockLabel}}</button>

    <!-- Colour is per-node, so it needs a single active node -->
    <template v-if="selectedNodeId">
      <h3>Node Color</h3>
      <div class="color-grid">
        <button
          v-for="color in colors"
          :key="color"
          class="color-swatch"
          :style="{ backgroundColor: color }"
          :class="{ active: getNodeColor(selectedNodeId) === color }"
          @click="$emit('update-color', color)"
          :title="color"
        ></button>
      </div>
      <div class="custom-color-picker-row">
        <label :for="colorInputId">Custom Color:</label>
        <input
          :id="colorInputId"
          type="color"
          class="color-picker-input"
          :value="getNodeColor(selectedNodeId)"
          @input="(e) => $emit('update-color', e.target.value)"
        />
      </div>

      <div class="zindex-picker-row">
        <label :for="zIndexInputId">Z-Index:</label>
        <input
          :id="zIndexInputId"
          type="number"
          step="1"
          class="zindex-input"
          :value="getNodeZIndex(selectedNodeId)"
          @input="(e) => $emit('update-zindex', Number(e.target.value))"
        />
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, useId } from 'vue'

const props = defineProps({
  colors: {
    type: Array,
    required: true,
  },
  nodes: {
    type: Array,
    required: true,
  },
  // The single active node, which the per-node controls act on
  selectedNodeId: {
    // Ids come straight off the nodes, and a hand-edited file can hold numbers
    type: [String, Number],
    default: null,
  },
  // Every selected node, which decides how many get duplicated
  selectedNodeIds: {
    type: Array,
    default: () => [],
  },
})

defineEmits(['lock-movement','duplicate', 'update-color', 'update-zindex'])

// The sidebar and the context menu can render this panel at the same time,
// so the labels need ids that do not collide
const uid = useId()
const colorInputId = `custom-node-color-${uid}`
const zIndexInputId = `node-zindex-${uid}`

const duplicateButtonLabel = computed(() => {
  const count = props.selectedNodeIds.length
  return count > 1 ? `Duplicate ${count} Nodes` : 'Duplicate Node'
})

const getNodeColor = (id) => {
  const node = props.nodes.find((n) => n.id === id)
  return node?.data?.bgColor || '#fffff0'
}

const getNodeZIndex = (id) => {
  const node = props.nodes.find((n) => n.id === id)
  return node?.zIndex ?? node?.data?.zIndex ?? 0
}

// Feature/node-movement-lock: Does not work for now
const toggleNodeLockLabel = computed(() => {
  const node = props.nodes.find((n) => n.id === props.selectedNodeId)
  // undefined (fresh node) → treat as unlocked → "Lock"
  return node?.draggable === false ? 'Unlock Node Position' : 'Lock Node Position'
})
</script>

<style>
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

.zindex-picker-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 0.85rem;
  color: #2c3e50;
}

.zindex-input {
  width: 60px;
  padding: 0.4rem 0.6rem;
  font-size: 0.85rem;
  font-family: inherit;
  color: #2c3e50;
  background: white;
  border: 1px solid #d0d0d0;
  border-radius: 4px;
  text-align: right;
}

.zindex-input:focus {
  outline: none;
  border-color: #2c3e50;
}
</style>