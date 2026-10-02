<template>
  <div class="top-nav-bar">
    <a
      href="https://debmalya99.github.io/"
      target="_blank"
      rel="noopener noreferrer"
      class="nav-icon-btn"
      title="Home / Portfolio Website"
    >
      <svg class="icon" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
      </svg>
    </a>
    <a
      href="https://github.com/Debmalya99/Deb-s-Mindmap-Maker"
      target="_blank"
      rel="noopener noreferrer"
      class="nav-icon-btn"
      title="GitHub Repository for Deb's Mindmap Maker"
    >
      <svg class="icon" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
      </svg>
    </a>
  </div>
</template>

<script setup>
</script>

<style scoped>
.top-nav-bar {
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
  padding: 0.35rem 0.5rem;
  border-radius: 8px;
  border: 1px solid #d0d7de;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.nav-icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  color: #2c3e50;
  text-decoration: none;
  transition: background 0.2s, color 0.2s, transform 0.15s;
}

.nav-icon-btn:hover {
  background: #f0f2f5;
  color: #247ad1;
  transform: translateY(-1px);
}

.icon {
  display: block;
}
</style>
