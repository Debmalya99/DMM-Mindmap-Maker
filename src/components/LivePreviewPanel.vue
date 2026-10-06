<template>
  <div v-if="editingNodeId" class="live-preview-panel">
    <div class="live-preview-panel__header">
      <span>Live Preview</span>
      <button @click="stopEditing" class="close-btn" title="Close">&times;</button>
    </div>
    <div class="live-preview-panel__body" v-html="rendered"></div>
  </div>
</template>

<script setup>
import { computed, watch, ref } from 'vue'
import { useEditingNode } from '../composables/useEditingNode.js'
import { renderMarkdown } from '../utils/markdownRenderer.js'

const { editingNodeId, editingNodeContent, stopEditing } = useEditingNode()

const rendered = ref('')
let debounceTimer = null


// Debounce for optimization
watch(
  editingNodeContent,
  (newContent)=>{
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(()=>{rendered.value = renderMarkdown(newContent)},100)
    
  },{immediate:true}
)

// const rendered = computed(() => renderMarkdown(editingNodeContent.value))
</script>

<style scoped>
.live-preview-panel {
  position: fixed;
  top: 80px;
  right: 20px;
  width: 320px;
  max-height: calc(100vh - 100px);
  background: #ffffff;
  border: 1px solid #d0d7de;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.live-preview-panel__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid #e1e4e8;
  font-size: 0.8rem;
  color: #57606a;
  background: #f6f8fa;
  font-weight: 600;
}

.close-btn {
  background: transparent;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: #57606a;
  padding: 0 4px;
  line-height: 1;
}

.close-btn:hover {
  color: #e74c3c;
}

.live-preview-panel__body {
  padding: 12px;
  overflow-y: auto;
  font-size: 0.9rem;
  line-height: 1.5;
  color: #2c3e50;
}

/* Match the rendered-content styles from MindmapNode.vue so preview == final view */
.live-preview-panel__body :deep(p) {
  margin-bottom: 0.5rem;
}

.live-preview-panel__body :deep(h1),
.live-preview-panel__body :deep(h2),
.live-preview-panel__body :deep(h3),
.live-preview-panel__body :deep(h4) {
  font-weight: 600;
  margin-top: 0.5rem;
  margin-bottom: 0.3rem;
  color: #1a252f;
  font-family: Georgia, "Times New Roman", serif;
}

.live-preview-panel__body :deep(h1) { font-size: 1.3rem; }
.live-preview-panel__body :deep(h2) { font-size: 1.2rem; }
.live-preview-panel__body :deep(h3) { font-size: 1.1rem; }

.live-preview-panel__body :deep(ul),
.live-preview-panel__body :deep(ol) {
  padding-left: 1.2rem;
  margin-bottom: 0.5rem;
}

.live-preview-panel__body :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 0.5rem;
  font-size: 0.85rem;
  background: white;
}

.live-preview-panel__body :deep(th),
.live-preview-panel__body :deep(td) {
  border: 1px solid #d0d7de;
  padding: 4px 8px;
  text-align: left;
}

.live-preview-panel__body :deep(th) {
  background-color: #f6f8fa;
  font-weight: 600;
}

.live-preview-panel__body :deep(code) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.85em;
  background: rgba(0, 0, 0, 0.06);
  padding: 0.15em 0.3em;
  border-radius: 4px;
}

.live-preview-panel__body :deep(pre) {
  background: #f6f8fa;
  border: 1px solid #e1e4e8;
  border-radius: 6px;
  padding: 8px;
  overflow-x: auto;
  margin-bottom: 0.5rem;
}

.live-preview-panel__body :deep(pre code) {
  background: transparent;
  padding: 0;
  border-radius: 0;
  font-size: 0.85rem;
  color: #24292e;
}

.live-preview-panel__body :deep(blockquote) {
  border-left: 3px solid #42b883;
  margin: 0 0 0.5rem 0;
  padding-left: 8px;
  color: #57606a;
  background: rgba(66, 184, 131, 0.05);
  font-style: italic;
  border-radius: 0 4px 4px 0;
}
</style>