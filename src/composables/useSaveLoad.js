// Part of REFACTOR/save-load-composable
import { ref,toRaw } from "vue";


export function useSaveLoad(nodes,edges,edgeStyle,buildMarker,selectedNodeId,selectedEdgeId)
{
    const currentFileHandle = ref(null)
    const saveStatus = ref('') // '' | 'saving' | 'saved'
    let saveTimer = null

    // FUNCTION: Save & Save As
    const executeSave = async (isSaveAs = false) => {
    if (!window.showSaveFilePicker) {
            alert('File System Access API is not supported in this browser.')
            return
    }
    saveStatus.value = 'saving'
    if (saveTimer) clearTimeout(saveTimer)
    try {
        let handle = currentFileHandle.value
        if (isSaveAs || !handle) {
        handle = await window.showSaveFilePicker({
            types: [
            {
                description: 'Mindmap Files (.dmm.json)',
                accept: { 'application/json': ['.dmm.json'] },
            },
            ],
        })
        currentFileHandle.value = handle
        }
        const writable = await handle.createWritable()
        const state = {
        nodes: toRaw(nodes.value),
        edges: toRaw(edges.value),
        }
        await writable.write(JSON.stringify(state, null, 2))
        await writable.close()
        saveStatus.value = 'saved'
        saveTimer = setTimeout(() => {
        saveStatus.value = ''
        }, 2000)
    } catch (err) {
                saveStatus.value = ''
                if (err.name !== 'AbortError') {
                console.error('Failed to save mindmap:', err)
                alert('Failed to save mindmap file.')
            }
        }
    }

    //FUNCTION: Load
    const loadMindmap = async () => {
        if (!window.showOpenFilePicker) {
            alert('File System Access API is not supported in this browser.')
            return
        }
        try {
            const [handle] = await window.showOpenFilePicker({
            types: [
                {
                description: 'Mindmap Files (.dmm.json, .json)',
                accept: { 'application/json': ['.dmm.json', '.json'] },
                },
            ],
            multiple: false,
            })
            currentFileHandle.value = handle
            const file = await handle.getFile()
            const content = await file.text()
            const parsed = JSON.parse(content)

            if (parsed.nodes) {
            nodes.value = parsed.nodes.map((n) => {
                const z = Number.isFinite(n.zIndex) ? Math.floor(n.zIndex) : (Number.isFinite(n.data?.zIndex) ? Math.floor(n.data.zIndex) : 0)
                const style = n.style ? { ...n.style } : {}
                style.zIndex = z
                return {
                ...n,
                zIndex: z,
                data: n.data ? { ...n.data, zIndex: z } : { zIndex: z },
                style,
                }
            })
            }
            if (parsed.edges) {
            edges.value = parsed.edges.map((e) => ({
                ...e,
                style: e.style || edgeStyle,
                markerStart: e.data?.dirMode === 2 || e.data?.dirMode === 3 ? buildMarker() : undefined,
                markerEnd: e.data?.dirMode === 1 || e.data?.dirMode === 3 ? buildMarker() : undefined,
            }))
            }
            selectedNodeId.value = null
            selectedEdgeId.value = null
        } catch (err) {
            if (err.name !== 'AbortError') {
            console.error('Failed to load mindmap:', err)
            alert('Failed to load mindmap file.')
            }
        }
        }

    return {
        currentFileHandle,
        saveStatus,
        saveTimer,
        executeSave,
        loadMindmap
    }

}