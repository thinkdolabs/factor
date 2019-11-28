/* eslint-disable jest/no-export */
import { dirname, resolve } from "path"
import { factorize } from "@factor/cli/factorize"
import getPortUtility from "get-port"

export { default as rp } from "request-promise-native"
import { removeSync } from "fs-extra"
import { generateLoaders } from "@factor/cli/extension-loader"
import { buildProductionApp } from "@factor/build/webpack-config"
import { createApp } from "@factor/app/app"

import jsdom from "jsdom"

export async function getPort(): Promise<string> {
  const port = await getPortUtility()
  return String(port)
}
export const waitFor = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms || 0))
}

export const indexHtml = ({
  head = `<title>NOT SET</title>`,
  body = `<div id="app"></div>`
} = {}): string => {
  return `<!DOCTYPE html><html><head>${head}</head><body>${body}</body></html>`
}

export function getUrl({ route = "", port }): string {
  return `http://localhost:${port}${route}`
}

export const buildFixture = (fixture): void => {
  process.env.FACTOR_CWD = dirname(require.resolve(fixture))
  process.env.FACTOR_ENV = "test"

  removeSync(resolve(process.env.FACTOR_CWD, ".factor"))
  removeSync(resolve(process.env.FACTOR_CWD, "dist"))

  test(`Build ${fixture}`, async () => {
    let error

    try {
      generateLoaders()
      await factorize()

      await buildProductionApp({ testing: true })
    } catch (error_) {
      error = error_
    }

    expect(error).not.toBeTruthy()
  }, 100000)
}

export const loadFixture = async (fixture): Promise<void> => {
  process.env.FACTOR_CWD = dirname(require.resolve(fixture))

  process.env.FACTOR_ENV = "test"

  await factorize()
  await createApp()
}

interface JSDomConfig {
  port?: string;
  route?: string;
  url?: string;
  options?: object;
}

export async function renderAndGetWindow(
  _arguments: JSDomConfig = {}
): jsdom.JSDOM.window {
  const { port = process.env.PORT, route = "/" } = _arguments

  let { url, options = {} } = _arguments

  url = url ? url : getUrl({ port, route })

  options = {
    resources: "usable",
    runScripts: "dangerously",
    beforeParse(window): void {
      // Mock window.scrollTo
      window.scrollTo = (): void => {}
    },
    ...options
  }

  const { window } = await jsdom.JSDOM.fromURL(url, options)

  return window
}