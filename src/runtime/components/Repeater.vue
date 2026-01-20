<script lang="ts">
  import { useFormRepeater, type FormRepeaterProps } from "@formwerk/core"

  export type RepeaterProps = Omit<
    FormRepeaterProps,
    "form" | "addButtonProps" | "removeButtonLabel" | "moveUpButtonLabel" | "moveDownButtonLabel"
  > & {
    ui?: {
      root?: string
      leading?: string
      wrapper?: string
      item?: string
      trailing?: string
    }
  }

  export interface RepeaterMethods {
    add: (count?: number) => void
    remove: (index: number) => void
    move: (from: number, to: number) => void
    swap: (indexA: number, indexB: number) => void
    insert: (index: number, count?: number) => void
  }

  export interface RepeaterSlotProps {
    items: readonly string[]
    repeater: RepeaterMethods
  }

  export interface RepeaterDefaultSlotProps extends RepeaterSlotProps {
    index: number
    isFirst: boolean
    isLast: boolean
  }

  export interface RepeaterWrapperSlotProps extends RepeaterSlotProps {
    Iteration: ReturnType<typeof useFormRepeater>["Iteration"]
  }

  export interface RepeaterSlots {
    leading: (props: RepeaterSlotProps) => unknown
    wrapper: (props: RepeaterWrapperSlotProps) => unknown
    default: (props: RepeaterDefaultSlotProps) => unknown
    trailing: (props: RepeaterSlotProps) => unknown
  }
</script>

<script lang="ts" setup>
  const { name, min, max, ...props } = defineProps<RepeaterProps>()

  defineSlots<RepeaterSlots>()

  const { Iteration, items, ...repeater } = useFormRepeater({ name, min, max })
</script>

<template>
  <div :class="props.ui?.root">
    <div v-if="$slots.leading" :class="props.ui?.leading">
      <slot name="leading" v-bind="{ items, repeater }" />
    </div>
    <div :class="props.ui?.wrapper">
      <slot name="wrapper" v-bind="{ items, repeater, Iteration }">
      <Iteration v-for="(key, index) in items" :key="key" :index="index" as="div" :class="props.ui?.item">
        <slot
          v-bind="{
            index,
            items,
            isFirst: index === 0,
            isLast: index === items.length - 1,
            repeater,
          }" />
      </Iteration>
    </slot>
    </div>
    <div v-if="$slots.trailing" :class="props.ui?.trailing">
      <slot name="trailing" v-bind="{ items, repeater }" />
    </div>
  </div>
</template>
