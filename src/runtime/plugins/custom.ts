import { Experiment as ExperimentBrowser, type Variants, type ExposureTrackingProvider } from '@amplitude/experiment-js-client'
import { defineNuxtPlugin, useRuntimeConfig, useState } from '#app'

export default defineNuxtPlugin(async (_nuxtApp) => {
  const { experimentApiKey, userProvider, clientConfig, trackingProvider } = useRuntimeConfig().public.experiment
  const { config: { exposureTrackingProvider } } = trackingProvider as unknown as { name: 'custom', config: { exposureTrackingProvider: ExposureTrackingProvider } }
  const variants = useState<Variants>('experiment:variants')

  const experimentClient = ExperimentBrowser.initialize(experimentApiKey, {
    ...clientConfig,
    initialVariants: variants.value,
    exposureTrackingProvider,
    userProvider: {
      getUser: () => userProvider(),
    },
  })
  await experimentClient.start(userProvider())

  return {
    provide: {
      experimentClient,
    },
  }
})
