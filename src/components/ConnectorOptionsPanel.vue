<template>
  <div class="direction-section">
    <h3>Connector Options</h3>
    <button @click="$emit('switch-direction')" class="btn secondary">Switch Connector Direction</button>
    <div class="direction-current">
      Current: <strong>{{ directionLabel }}</strong>
    </div>
    <input
      type="text"
      class="edge-label-input"
      placeholder="Connector label (optional)"
      :value="edge?.data?.label || ''"
      @input="$emit('update-label', $event.target.value)"
    />
    <button @click="$emit('toggle-style')" class="btn secondary">Toggle Style</button>
    <button @click="$emit('remove')" class="btn danger">Remove Connector</button>
  </div>
</template>

<script setup>
defineProps({
  // The connector these controls act on
  edge: {
    type: Object,
    default: null,
  },
  directionLabel: {
    type: String,
    default: '',
  },
})

defineEmits(['switch-direction', 'update-label', 'toggle-style', 'remove'])
</script>

<style>
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
</style>