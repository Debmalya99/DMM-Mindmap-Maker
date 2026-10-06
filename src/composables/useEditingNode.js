import { ref } from 'vue'

// Module-level refs — shared across every component that imports this file
const editingNodeId = ref(null)
const editingNodeContent = ref('')

export function useEditingNode() {
  const startEditing = (id, content) => {
    editingNodeId.value = id
    editingNodeContent.value = content || ''
  }

  const updateContent = (content) => {
    editingNodeContent.value = content || ''
  }

  const stopEditing = () => {
    editingNodeId.value = null
    editingNodeContent.value = ''
  }

  return {
    editingNodeId,
    editingNodeContent,
    startEditing,
    updateContent,
    stopEditing,
  }
}