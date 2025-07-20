import { createClient } from '@blinkdotnew/sdk'

// Authenticated client for dashboard/organizer features
export const blink = createClient({
  projectId: 'gatherease-social-planner-5krmx3sw',
  authRequired: true
})