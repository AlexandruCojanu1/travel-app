"use client"

interface BusinessListViewProps {
  businesses: any[]
  onBusinessClick?: (business: any) => void
}

export function BusinessListView({ businesses, onBusinessClick }: BusinessListViewProps) {
  return (
    <div className="w-full max-w-screen-xl mx-auto px-4 md:px-6 lg:px-8 py-4 space-y-4">
      {businesses.map((business) => (
        <div 
          key={business.id} 
          className="p-5 airbnb-card cursor-pointer"
          onClick={() => onBusinessClick?.(business)}
        >
          <h3 className="font-semibold text-airbnb-dark text-base">{business.name}</h3>
        </div>
      ))}
    </div>
  )
}

