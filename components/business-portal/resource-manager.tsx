"use client"

interface ResourceManagerProps {
  businessId?: string
}

export function ResourceManager({ businessId }: ResourceManagerProps) {
  return (
    <div className="p-6">
      <p className="text-slate-600">Resource Manager - Coming soon</p>
      {businessId && <p className="text-xs text-slate-400 mt-2">Business ID: {businessId}</p>}
    </div>
  )
}

