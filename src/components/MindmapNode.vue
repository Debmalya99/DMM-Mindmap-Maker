<template>
  <div class="custom-mindmap-node" :style="{ backgroundColor: data.bgColor || '#fffff0' }">
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
  border-radius: 20px;
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
  color: #2c3e50;
  word-break: break-word;
  overflow-wrap: break-word;
  height: 100%;
  line-height: 1.5;
}

.rendered-content p {
  margin-bottom: 0.5rem;
}

.rendered-content h1,
.rendered-content h2,
.rendered-content h3,
.rendered-content h4 {
  font-weight: 600;
  margin-top: 0.5rem;
  margin-bottom: 0.3rem;
  color: #1a252f;
}

.rendered-content h1 { font-size: 1.3rem; }
.rendered-content h2 { font-size: 1.2rem; }
.rendered-content h3 { font-size: 1.1rem; }

.rendered-content ul,
.rendered-content ol {
  padding-left: 1.2rem;
  margin-bottom: 0.5rem;
}

.rendered-content li {
  margin-bottom: 0.2rem;
}

/* Tables */
.rendered-content table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 0.5rem;
  font-size: 0.85rem;
  background: white;
}

.rendered-content th,
.rendered-content td {
  border: 1px solid #d0d7de;
  padding: 4px 8px;
  text-align: left;
}

.rendered-content th {
  background-color: #f6f8fa;
  font-weight: 600;
}

/* Code blocks & inline code */
.rendered-content code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.85em;
  background: rgba(0, 0, 0, 0.06);
  padding: 0.15em 0.3em;
  border-radius: 4px;
}

.rendered-content pre {
  background: #f6f8fa;
  border: 1px solid #e1e4e8;
  border-radius: 6px;
  padding: 8px;
  overflow-x: auto;
  margin-bottom: 0.5rem;
}

.rendered-content pre code {
  background: transparent;
  padding: 0;
  border-radius: 0;
  font-size: 0.85rem;
  color: #24292e;
}

/* Blockquotes */
.rendered-content blockquote {
  border-left: 3px solid #42b883;
  margin: 0 0 0.5rem 0;
  padding-left: 8px;
  color: #57606a;
  background: rgba(66, 184, 131, 0.05);
  font-style: italic;
  border-radius: 0 4px 4px 0;
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
  transform: scale(5.0);
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
