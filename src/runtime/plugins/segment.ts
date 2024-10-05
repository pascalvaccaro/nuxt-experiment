import { Experiment as ExperimentBrowser, type Variants } from '@amplitude/experiment-js-client'
import { defineNuxtPlugin, useRuntimeConfig, useState } from '#app'

declare global {
  interface Window {
    analytics: InstanceType<typeof import('@segment/analytics-next').AnalyticsBrowser>
  }
}

export default defineNuxtPlugin(async (_nuxtApp) => {
  const { experimentApiKey, clientConfig, userProvider, trackingProvider } = useRuntimeConfig().public.experiment
  const { config: { apiKey: segmentApiKey, ...segmentConfig } } = trackingProvider
  const variants = useState<Variants>('experiment:variants')
  const { user_id, device_id } = userProvider()

  if (!window.analytics) {
    const { AnalyticsBrowser } = await import('@segment/analytics-next')
    window.analytics = new AnalyticsBrowser()
  }
  if (!window.analytics.instance?.initialized) {
    window.analytics.load({ writeKey: segmentApiKey, ...segmentConfig })
  }
  window.analytics.setAnonymousId(device_id)
  await window.analytics.ready()
  const user = await window.analytics.user()
  if (user_id) user.id(user_id)

  const experimentClient = ExperimentBrowser.initialize(experimentApiKey, {
    ...clientConfig,
    initialVariants: variants.value,
    exposureTrackingProvider: {
      track: (exposure) => {
        window.analytics.track('$exposure', exposure)
      },
    },
    userProvider: {
      getUser: () => ({
        user_id: user.id(),
        device_id: user.anonymousId(),
      }),
    },
  })

  await experimentClient.start({
    user_id: user.id()?.toString(),
    device_id: user.anonymousId()?.toString(),
  })

  return {
    provide: {
      experimentClient,
    },
  }
})
