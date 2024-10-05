import { Experiment as ExperimentBrowser, type Variants } from '@amplitude/experiment-js-client'
import { defineNuxtPlugin, useRuntimeConfig, useState } from '#app'

declare global {
  interface Window {
    amplitude: typeof import('@amplitude/analytics-browser')
  }
}

export default defineNuxtPlugin(async (_nuxtApp) => {
  const { experimentApiKey, clientConfig, userProvider, trackingProvider } = useRuntimeConfig().public.experiment
  const { config: { apiKey: amplitudeApiKey, ...amplitudeConfig } } = trackingProvider
  const variants = useState<Variants>('experiment:variants')
  const { user_id, device_id } = userProvider()

  window.amplitude ||= await import('@amplitude/analytics-browser')
  window.amplitude.init(amplitudeApiKey, amplitudeConfig)
  if (user_id) window.amplitude.setUserId(user_id)
  window.amplitude.setDeviceId(device_id)

  const experimentClient = ExperimentBrowser.initializeWithAmplitudeAnalytics(experimentApiKey, {
    ...clientConfig,
    initialVariants: variants.value,
  })
  await experimentClient.start()

  return {
    provide: {
      experimentClient,
    },
  }
})
