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
        @keydown.tab.prevent="handleTab"
        @keydown.shift.tab.prevent="handleShiftTab"
        placeholder="Type markdown / LaTeX..."
        class="nokey nowheel"
      ></textarea>

      <!-- View Mode: Rendered Markdown & LaTeX -->
      <div v-else class="rendered-content nowheel" v-html="renderedContent"></div>

      <button @click.stop="onDelete" class="delete-btn" title="Delete node">&times;</button>
    </div>
    <div class="nodelock-btn" title="Position is Locked for this node" v-if="data.draggable">&#128274;</div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, watch } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import { NodeResizer } from '@vue-flow/node-resizer'
import { marked } from 'marked'
import katex from 'katex'

// Feature/markdown-live-preview: 
import { renderMarkdown } from '../utils/markdownRenderer'
import { useEditingNode } from '../composables/useEditingNode'

//Feature/read-only
import { useReadOnly } from '../composables/useReadOnly'

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
//Feature/markdown-live-preview
const { startEditing: notifyStart, updateContent, stopEditing: notifyStop } = useEditingNode()

//Feature/read-only
const {isReadOnly} = useReadOnly()

const textareaRef = ref(null)

const startEditing = () => {
  if (isReadOnly.value) return
  isEditing.value = true
  console.log('started editing node:', props.id) // 👈 temporary debug
  notifyStart(props.id, props.data.label) // 👈 tell the panel we're editing
  nextTick(() => {
    textareaRef.value?.focus()
  })
}

const stopEditing = () => {
  isEditing.value = false
  notifyStop() // 👈 tell the panel to hide
}

const renderedContent = computed(() => {
  return renderMarkdown(props.data.label);
})

const onDelete = () => {
  window.dispatchEvent(new CustomEvent('delete-node', { detail: props.id }))
}

watch(
  ()=>props.data.label,
  (newVal)=>{
    if (isEditing.value) updateContent(newVal)
  }
)

// Feature/markdown-live-preview: Adding tab key support in the text area.
const INDENT = '\t' // 4 spaces can be changed to 2 spaces or \t for a real tab.

const handleTab = () => {
  const el = textareaRef.value
  if (!el) return

  const value = el.value
  const start = el.selectionStart
  const end = el.selectionEnd

  // Find the boundaries of the lines touched by the selection
  const lineStart = value.lastIndexOf('\n', start - 1) + 1
  const lineEnd = value.indexOf('\n', end) === -1 ? value.length : value.indexOf('\n', end)

  const selectedText = value.substring(lineStart, lineEnd)
  const lines = selectedText.split('\n')
  const indented = lines.map((line) => INDENT + line).join('\n')

  // Replace the whole block in one go
  el.setRangeText(indented, lineStart, lineEnd, 'preserve')

  // Manually nudge the selection so the highlighted text stays highlighted
  el.selectionStart = start + INDENT.length
  el.selectionEnd = end + INDENT.length * lines.length

  // Tell Vue the value changed (this is what v-model listens for)
  el.dispatchEvent(new Event('input', { bubbles: true }))
}

// DOES NOT WORK
const handleShiftTab = () => {
  const el = textareaRef.value
  if (!el) return

  const value = el.value
  const start = el.selectionStart
  const end = el.selectionEnd

  const lineStart = value.lastIndexOf('\n', start - 1) + 1
  const lineEnd = value.indexOf('\n', end) === -1 ? value.length : value.indexOf('\n', end)

  const selectedText = value.substring(lineStart, lineEnd)
  const lines = selectedText.split('\n')

  // Remove up to INDENT.length leading spaces (or a tab) from each line
  const outdented = lines
    .map((line) => {
      if (line.startsWith('\t')) return line.substring(1)
      let removed = 0
      while (removed < INDENT.length && line[removed] === ' ') removed++
      return line.substring(removed)
    })
    .join('\n')

  el.setRangeText(outdented, lineStart, lineEnd, 'preserve')

  // Adjust selection after removal
  const removedTotal = selectedText.length - outdented.length
  el.selectionStart = Math.max(lineStart, start - INDENT.length)
  el.selectionEnd = end - removedTotal

  el.dispatchEvent(new Event('input', { bubbles: true }))
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
  /* font-family: Georgia, "Times New Roman", serif; */
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
  font-family: Georgia, "Times New Roman", serif;
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

.nodelock-btn {
  position: absolute;
  bottom: 2px;
  left: 2px;
  background: transparent;
  border: none;
  font-size: 1.0rem;
  color: #999;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  z-index: 5;
  opacity: 1;
}

.nodelock-btn:hover{
  opacity: 0.2;
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
