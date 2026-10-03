<template>
  <div class="help-tooltip-container">
    <span class="help-icon" :title="iconTitle">{{ icon }}</span>
    <div class="help-popover">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
defineProps({
  icon: {
    type: String,
    default: '💡',
  },
  iconTitle: {
    type: String,
    default: 'Help & Tips',
  },
})
</script>

<style scoped>
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
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 100;
  transition: opacity 0.2s ease, visibility 0.2s ease;
  font-size: 0.8rem;
  line-height: 1.4;
}

.help-tooltip-container:hover .help-popover {
  visibility: visible;
  opacity: 1;
}
</style>
