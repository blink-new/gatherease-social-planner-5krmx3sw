import { createClient } from '@blinkdotnew/sdk'

// Completely isolated public client for public event viewing
// This client has no authentication requirements and won't trigger auth flows
export const blinkPublic = createClient({
  projectId: 'gatherease-social-planner-5krmx3sw',
  authRequired: false
})