import { Experiment as ExperimentBrowser, type Variants } from '@amplitude/experiment-js-client'
import type { SDKEventAttrs } from '@mparticle/web-sdk'
import { defineNuxtPlugin, useRuntimeConfig, useState } from '#app'

declare global {
  interface Window {
    mParticle: typeof import('@mparticle/web-sdk')
  }
}

export default defineNuxtPlugin(async (_nuxtApp) => {
  const { experimentApiKey, clientConfig, userProvider, trackingProvider } = useRuntimeConfig().public.experiment
  const { config: { apiKey: mParticleApiKey, ...mParticleConfig } } = trackingProvider
  const variants = useState<Variants>('experiment:variants')
  const { user_id, device_id } = userProvider()

  window.mParticle ||= await import('@mparticle/web-sdk').then(({ default: mParticle }) => mParticle)
  if (!window.mParticle.isInitialized()) {
    window.mParticle.init(mParticleApiKey, mParticleConfig)
  }
  window.mParticle.setDeviceId(device_id)
  if (user_id) window.mParticle.Identity.login({ userIdentities: { customerid: user_id } })

  const experimentClient = ExperimentBrowser.initialize(experimentApiKey, {
    ...clientConfig,
    initialVariants: variants.value,
    exposureTrackingProvider: {
      track: (exposure) => {
        window.mParticle.logEvent('$exposure', window.mParticle.EventType.Other, exposure as unknown as SDKEventAttrs)
      },
    },
    userProvider: {
      getUser: () => {
        const user_id = window.mParticle.Identity.getCurrentUser().getUserIdentities().userIdentities.customerid
        const device_id = window.mParticle.getDeviceId()
        return {
          user_id,
          device_id,
        }
      },
    },
  })

  await experimentClient.start()

  return {
    provide: {
      experimentClient,
    },
  }
})
