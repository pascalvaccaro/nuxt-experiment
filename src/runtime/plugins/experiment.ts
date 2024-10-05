import { ExperimentClient, type Variants } from '@amplitude/experiment-js-client'
import { Experiment as ExperimentServer } from '@amplitude/experiment-node-server'
import { defineNuxtPlugin, useRuntimeConfig, useState } from '#app'

export default defineNuxtPlugin(async (_nuxtApp) => {
  const { experimentApiKey, clientConfig, remoteConfig, userProvider } = useRuntimeConfig().public.experiment
  const variants = useState<Variants>('experiment:variants')

  const instance = ExperimentServer.initializeRemote(experimentApiKey, remoteConfig)
  variants.value = await instance.fetchV2(userProvider())

  const experimentClient = new ExperimentClient(experimentApiKey, {
    ...clientConfig,
    initialVariants: variants.value,
  })

  return {
    provide: {
      experimentClient,
    },
  }
})
