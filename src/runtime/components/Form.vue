<script lang="ts">
  import { useFormContext } from "@formwerk/core"
  import { useFormwerkBridge } from "../composables/useFormwerkBridge"
  import type { FormwerkInputEvents } from "../types/form"

  export interface Props {
    validateOn?: FormwerkInputEvents
    disabled?: boolean
  }
</script>

<script lang="ts" setup>
  export interface FormSlots {
    default(props: { blurredFields: ReadonlySet<string>; touchedFields: ReadonlySet<string>; dirtyFields: ReadonlySet<string> }): any
  }
  const formContext = useFormContext()

  if (!formContext) {
    throw new Error("FormwerkForm must be used within a component that has called useForm()")
  }

  const { context, isSubmitAttempted } = formContext

  const { validateOn = "blur", disabled = false } = defineProps<Props>()

  const { dirtyFields, touchedFields, blurredFields } = useFormwerkBridge({
    id: context.id,
    validateOn: () => validateOn,
    disabled: () => disabled,
    isSubmitAttempted: () => isSubmitAttempted.value,
  })
</script>

<template>
  <div>
    <slot :blurred-fields="blurredFields" :touched-fields="touchedFields" :dirty-fields="dirtyFields" />
  </div>
</template>
