// MSAL (browser) auth for Business Central.
//
// Uses the authorization-code + PKCE flow via a popup. Tokens are cached in
// sessionStorage and refreshed silently when possible.

import {
  PublicClientApplication,
  InteractionRequiredAuthError,
  type AccountInfo,
} from "@azure/msal-browser"
import { BC_AUTHORITY, BC_SCOPE, bcConfig } from "./config"

let msalInstance: PublicClientApplication | null = null
let initPromise: Promise<PublicClientApplication> | null = null

async function getInstance(): Promise<PublicClientApplication> {
  if (msalInstance) return msalInstance
  if (!initPromise) {
    const instance = new PublicClientApplication({
      auth: {
        clientId: bcConfig.clientId,
        authority: BC_AUTHORITY,
        redirectUri: window.location.origin,
      },
      cache: {
        cacheLocation: "sessionStorage",
      },
    })
    initPromise = instance.initialize().then(() => {
      msalInstance = instance
      return instance
    })
  }
  return initPromise
}

function getActiveAccount(instance: PublicClientApplication): AccountInfo | null {
  return instance.getActiveAccount() ?? instance.getAllAccounts()[0] ?? null
}

/** Returns the signed-in account, or null if not signed in. */
export async function getAccount(): Promise<AccountInfo | null> {
  const instance = await getInstance()
  return getActiveAccount(instance)
}

/** Triggers an interactive sign-in (popup) and returns the account. */
export async function signIn(): Promise<AccountInfo> {
  const instance = await getInstance()
  const result = await instance.loginPopup({ scopes: [BC_SCOPE] })
  instance.setActiveAccount(result.account)
  return result.account
}

export async function signOut(): Promise<void> {
  const instance = await getInstance()
  const account = getActiveAccount(instance) ?? undefined
  await instance.logoutPopup({ account })
}

/**
 * Acquires a BC access token, signing in interactively only if required.
 */
export async function getAccessToken(): Promise<string> {
  const instance = await getInstance()
  let account = getActiveAccount(instance)

  if (!account) {
    account = await signIn()
  }

  try {
    const result = await instance.acquireTokenSilent({ scopes: [BC_SCOPE], account })
    return result.accessToken
  } catch (err) {
    if (err instanceof InteractionRequiredAuthError) {
      const result = await instance.acquireTokenPopup({ scopes: [BC_SCOPE], account })
      return result.accessToken
    }
    throw err
  }
}
