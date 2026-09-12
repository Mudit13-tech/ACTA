/** The action loop, in order. The server owns the logic; this is just labels. */
export const STAGES = [
  { id: 'understand', name: 'Understand' },
  { id: 'search', name: 'Search' },
  { id: 'compare', name: 'Compare' },
  { id: 'decide', name: 'Decide' },
  { id: 'monitor', name: 'Monitor' },
  { id: 'prepare', name: 'Prepare' },
  { id: 'approval', name: 'Request approval' },
  { id: 'execute', name: 'Execute' },
  { id: 'verify', name: 'Verify' },
] as const;
