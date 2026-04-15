export function showToast(message: string) {
  window.dispatchEvent(new CustomEvent('pwa_v2_toast', { detail: message }))
}
