import { defu } from 'defu'
import { defineNuxtModule, addPlugin, createResolver } from '@nuxt/kit'
import type { ExperimentConfig, ExperimentUser, ExposureTrackingProvider } from '@amplitude/experiment-js-client'
import type { RemoteEvaluationConfig } from '@amplitude/experiment-node-server'
import type { AnalyticsBrowserSettings } from '@segment/analytics-next'
import type { MPConfiguration } from '@mparticle/web-sdk'
import type { Types } from '@amplitude/analytics-browser'

export interface ModuleOptions {
  experimentApiKey: string
  clientConfig: Omit<ExperimentConfig, 'userProvider'>
  remoteConfig: RemoteEvaluationConfig
  trackingProvider: {
    name: 'amplitude'
    config: Partial<Types.BrowserConfig> & { apiKey: string }
  } | {
    name: 'segment'
    config: AnalyticsBrowserSettings & { apiKey: string }
  } | {
    name: 'mParticle'
    config: MPConfiguration & { apiKey: string }
  } | {
    name: 'custom'
    config: { exposureTrackingProvider: ExposureTrackingProvider }
  }
  userProvider: () => ExperimentUser
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-experiment',
    configKey: 'experiment',
  },
  // Default configuration options of the Nuxt module
  defaults: {
    trackingProvider: { name: 'amplitude', config: { apiKey: '' } },
    experimentApiKey: '',
    clientConfig: {},
    remoteConfig: {},
    userProvider: () => ({
      user_id: '',
      device_id: '',
      user_properties: {},
    }),
  },
  setup(_options, _nuxt) {
    _nuxt.options.runtimeConfig.public.experiment = defu(_nuxt.options.runtimeConfig.public.experiment, _options)

    const resolver = createResolver(import.meta.url)
    // Do not add the extension since the `.ts` will be transpiled to `.mjs` after `npm run prepack`
    addPlugin({ src: resolver.resolve('./runtime/plugins/experiment'), mode: 'server', order: 1 })
    addPlugin({ src: resolver.resolve(`./runtime/plugins/${_options.trackingProvider.name}`), mode: 'client', order: 2 })
  },
})
