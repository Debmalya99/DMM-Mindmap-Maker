<template>
    <div class="document-title">
        {{documentName}}
    </div>
</template>

<script setup>
const props = defineProps({
    documentName:{
        type:String,
        required:true,
    }
})
</script>

<style>
    .document-title{
        position: relative;
        padding: 10px;
        padding-left: 60px;
        text-decoration: underline;
        font-size:larger;
        z-index: 100;
    }
</style>