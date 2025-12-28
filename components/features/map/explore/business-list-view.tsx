"use client"

interface BusinessListViewProps {
  businesses: any[]
  onBusinessClick?: (business: any) => void
}

export function BusinessListView({ businesses, onBusinessClick }: BusinessListViewProps) {
  return (
    <div className="space-y-4">
      {businesses.map((business) => (
        <div 
          key={business.id} 
          className="p-4 bg-white rounded-lg border border-slate-200 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onBusinessClick?.(business)}
        >
          <h3 className="font-semibold text-slate-900">{business.name}</h3>
        </div>
      ))}
    </div>
  )
}

