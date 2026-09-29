<template>
  <div class="custom-mindmap-node" :style="{ backgroundColor: data.bgColor || '#ffffff' }">
    <!-- Built-in Vue Flow Node Resizer with bottom-right handle -->
    <NodeResizer :min-width="140" :min-height="140" />

    <!-- 4 Connection Handles with unique IDs for precise pin-to-pin connections -->
    <Handle id="top" type="source" :position="Position.Top" class="handle top" />
    <Handle id="bottom" type="source" :position="Position.Bottom" class="handle bottom" />
    <Handle id="left" type="source" :position="Position.Left" class="handle left" />
    <Handle id="right" type="source" :position="Position.Right" class="handle right" />

    <div class="node-content" @click="startEditing">
      <!-- Edit Mode: Raw Markdown Textarea -->
      <textarea
        v-if="isEditing"
        ref="textareaRef"
        v-model="data.label"
        @blur="stopEditing"
        @click.stop
        placeholder="Type markdown / LaTeX..."
      ></textarea>

      <!-- View Mode: Rendered Markdown & LaTeX -->
      <div v-else class="rendered-content" v-html="renderedContent"></div>

      <button @click.stop="onDelete" class="delete-btn" title="Delete node">&times;</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import { NodeResizer } from '@vue-flow/node-resizer'
import { marked } from 'marked'
import katex from 'katex'

// Import styles
import '@vue-flow/node-resizer/dist/style.css'
import 'katex/dist/katex.min.css'

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  data: {
    type: Object,
    required: true,
  },
})

const isEditing = ref(false)
const textareaRef = ref(null)

const startEditing = () => {
  isEditing.value = true
  nextTick(() => {
    textareaRef.value?.focus()
  })
}

const stopEditing = () => {
  isEditing.value = false
}

const renderedContent = computed(() => {
  const text = props.data.label || ''
  // Process KaTeX math blocks $$...$$ or inline $...$
  let processed = text
    .replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
      try {
        return katex.renderToString(math.trim(), { displayMode: true, throwOnError: false })
      } catch (e) {
        return `[Math Error: ${e.message}]`
      }
    })
    .replace(/\$([^\$]+?)\$/g, (_, math) => {
      try {
        return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false })
      } catch (e) {
        return `[Math Error: ${e.message}]`
      }
    })

  return marked.parse(processed)
})

const onDelete = () => {
  window.dispatchEvent(new CustomEvent('delete-node', { detail: props.id }))
}
</script>

<style>
.custom-mindmap-node {
  border: 2px solid #42b883;
  border-radius: 8px;
  padding: 12px;
  width: 100%;
  height: 100%;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  position: relative;
  font-family: inherit;
  display: flex;
  flex-direction: column;
  transition: background-color 0.2s;
}

.node-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  position: relative;
  height: 100%;
  cursor: pointer;
  overflow: auto;
}

.custom-mindmap-node textarea {
  border: none;
  outline: none;
  font-size: 0.95rem;
  width: 100%;
  height: 100%;
  background: transparent;
  color: #333;
  resize: none;
  word-break: break-word;
  white-space: pre-wrap;
  font-family: inherit;
}

.rendered-content {
  font-size: 0.95rem;
  color: #333;
  word-break: break-word;
  overflow-wrap: break-word;
  height: 100%;
}

.rendered-content p {
  margin-bottom: 0.5rem;
}

.rendered-content ul,
.rendered-content ol {
  padding-left: 1.2rem;
  margin-bottom: 0.5rem;
}

.rendered-content li {
  margin-bottom: 0.2rem;
}

.delete-btn {
  position: absolute;
  top: 2px;
  right: 2px;
  background: transparent;
  border: none;
  font-size: 1.1rem;
  color: #999;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  z-index: 5;
}

.delete-btn:hover {
  color: #fff;
  background: #e74c3c;
}

/* Tiny connection handles styling */
.handle {
  width: 10px;
  height: 10px;
  background: #42b883;
  border: 2px solid white;
  border-radius: 50%;
  transition: transform 0.2s, background 0.2s;
  z-index: 10;
}

.handle:hover {
  transform: scale(1.5);
  background: #3aa876;
}

.handle.top {
  top: -6px;
  left: 50%;
  transform: translateX(-50%);
}

.handle.top:hover {
  transform: translateX(-50%) scale(1.5);
}

.handle.bottom {
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
}

.handle.bottom:hover {
  transform: translateX(-50%) scale(1.5);
}

.handle.left {
  left: -6px;
  top: 50%;
  transform: translateY(-50%);
}

.handle.left:hover {
  transform: translateY(-50%) scale(1.5);
}

.handle.right {
  right: -6px;
  top: 50%;
  transform: translateY(-50%);
}

.handle.right:hover {
  transform: translateY(-50%) scale(1.5);
}
</style>
