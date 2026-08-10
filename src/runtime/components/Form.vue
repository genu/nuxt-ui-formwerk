<script lang="ts">
  import { useFormContext } from "@formwerk/core"
  import { useFormRoot } from "../composables/useFormRoot"
  import type { FormwerkInputEvents } from "../types/form"

  export interface Props {
    validateOn?: FormwerkInputEvents
    disabled?: boolean
  }
</script>

<script lang="ts" setup>
  export interface FormSlots {
    default(props: { blurredFields: ReadonlySet<any>; touchedFields: ReadonlySet<any>; dirtyFields: ReadonlySet<any> }): any
  }

  const formContext = useFormContext()

  if (!formContext) {
    throw new Error("FormwerkForm must be used within a component that has called useForm()")
  }

  const { validateOn = "blur", disabled = false } = defineProps<Props>()

  const { blurredFields, touchedFields, dirtyFields } = useFormRoot(formContext, {
    validateOn: () => validateOn,
    disabled: () => disabled,
  })
</script>

<template>
  <div>
    <slot :blurred-fields="blurredFields" :touched-fields="touchedFields" :dirty-fields="dirtyFields" />
  </div>
</template>
