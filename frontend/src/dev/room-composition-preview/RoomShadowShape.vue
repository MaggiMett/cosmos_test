<template>
  <rect
    v-if="shape.type === 'rect'"
    :x="shape.x"
    :y="shape.y"
    :width="shape.width"
    :height="shape.height"
    :rx="shape.radius ?? 0"
    vector-effect="non-scaling-stroke"
  />
  <ellipse
    v-else-if="shape.type === 'ellipse'"
    :cx="shape.cx"
    :cy="shape.cy"
    :rx="shape.rx"
    :ry="shape.ry"
    vector-effect="non-scaling-stroke"
  />
  <polygon
    v-else
    :points="shape.points.map((point) => `${point.x},${point.y}`).join(' ')"
    vector-effect="non-scaling-stroke"
  />
</template>

<script setup lang="ts">
import type { BoundsShape } from "../../theme-engine/types";

defineProps<{ shape: BoundsShape }>();
</script>
