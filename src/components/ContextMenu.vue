<template>
  <div ref="menuRef" class="context-menu" :style="menuStyle">
    <slot />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'

// Anchored to the cursor in viewport coordinates, so it is a sibling of the
// canvas rather than a child of it
const props = defineProps({
  x: {
    type: Number,
    required: true,
  },
  y: {
    type: Number,
    required: true,
  },
})

const emit = defineEmits(['close'])

// Keeps the menu off the window edges when the click was near the bottom
// or the right of the screen
const VIEWPORT_MARGIN = 8

const menuRef = ref(null)
const anchor = ref({ left: props.x, top: props.y })

const menuStyle = computed(() => ({
  left: `${anchor.value.left}px`,
  top: `${anchor.value.top}px`,
}))

// The menu is sized by its contents, so flipping it towards the cursor is
// only possible after it has rendered
const place = async () => {
  anchor.value = { left: props.x, top: props.y }
  await nextTick()

  const el = menuRef.value
  if (!el) return

  const { offsetWidth, offsetHeight } = el

  if (props.x + offsetWidth + VIEWPORT_MARGIN > window.innerWidth) {
    anchor.value = {
      ...anchor.value,
      left: Math.max(VIEWPORT_MARGIN, props.x - offsetWidth),
    }
  }
  if (props.y + offsetHeight + VIEWPORT_MARGIN > window.innerHeight) {
    anchor.value = {
      ...anchor.value,
      top: Math.max(VIEWPORT_MARGIN, props.y - offsetHeight),
    }
  }
}

const isFromMenu = (target) => menuRef.value?.contains(target)

const close = () => emit('close')

// Anything outside the menu dismisses it, but interacting with the menu
// itself (colour pickers, the label field) must keep it open
const onMouseDown = (e) => {
  if (!isFromMenu(e.target)) close()
}

// Registered in the capture phase on purpose: Vue Flow opens its own context
// menu from the node/edge/pane handlers, and those run before a bubbling
// document listener. Capturing first means this only ever dismisses a menu
// that nothing else is about to reopen.
const onContextMenu = (e) => {
  if (isFromMenu(e.target)) {
    // Our menu replaces the browser one while it is open
    e.preventDefault()
    return
  }
  close()
}

const onKeydown = (e) => {
  if (e.key === 'Escape') close()
}

// Scrolling the canvas would leave the menu stranded, so it closes too
const onScroll = (e) => {
  if (!isFromMenu(e.target)) close()
}

onMounted(() => {
  place()
  document.addEventListener('mousedown', onMouseDown, true)
  document.addEventListener('contextmenu', onContextMenu, true)
  document.addEventListener('scroll', onScroll, true)
  window.addEventListener('keydown', onKeydown)
  window.addEventListener('resize', close)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onMouseDown, true)
  document.removeEventListener('contextmenu', onContextMenu, true)
  document.removeEventListener('scroll', onScroll, true)
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('resize', close)
})
</script>

<style scoped>
.context-menu {
  position: fixed;
  /* Above .vue-flow (z-index 0) and its .vue-flow__connectionline (1001) */
  z-index: 2000;
  width: 240px;
  max-height: 80vh;
  overflow-y: auto;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: white;
  border: 1px solid #d0d7de;
  border-radius: 6px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
}

/* Drags across a menu should not start a canvas drag or select its labels */
.context-menu,
.context-menu * {
  user-select: none;
}

.context-menu input {
  user-select: text;
}
</style>