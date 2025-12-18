<script setup lang="ts">
</script>

<template>
  <router-view v-slot="{ Component, route }">
    <keep-alive>
      <component :is="Component" v-if="route.path === '/'" :key="route.path" />
    </keep-alive>
    <component :is="Component" v-if="route.path !== '/'" :key="route.path" />
  </router-view>
</template>
