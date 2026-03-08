import { useState } from 'react'

// Services available in the booking system
export type Service = 'room' | 'car' | 'golf' | 'bus'

// Guest information
export interface Guest {
  name: string
  phone: string
  email: string
  company?: string
  country?: string
}

// Booking information
export interface Booking {
  service: Service
  date: string
  time?: string
  pax: number
  guest: Guest
  notes?: string
}

// PID Database entry
export interface PIDEntry {
  pid: string
  name: string
  phone: string
  company?: string
  country?: string
}

// Global settings
export interface GlobalSettings {
  tripAuthorizer: string
  defaultCountry: string
}

function App() {
  const [currentView, setCurrentView] = useState<'home' | 'booking'>('home')
  const [selectedService, setSelectedService] = useState<Service | null>(null)

  // TODO: Implement booking flow based on memory/2026-03-08.md

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">🏨 Fairy - Hotel Booking System</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {currentView === 'home' ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <ServiceCard
              title="Room"
              icon="🛏️"
              onClick={() => {
                setSelectedService('room')
                setCurrentView('booking')
              }}
            />
            <ServiceCard
              title="Car"
              icon="🚗"
              onClick={() => {
                setSelectedService('car')
                setCurrentView('booking')
              }}
            />
            <ServiceCard
              title="Golf"
              icon="⛳"
              onClick={() => {
                setSelectedService('golf')
                setCurrentView('booking')
              }}
            />
            <ServiceCard
              title="Bus"
              icon="🚌"
              onClick={() => {
                setSelectedService('bus')
                setCurrentView('booking')
              }}
            />
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6">
            <p>Booking form for {selectedService} - TODO</p>
            <button
              className="mt-4 text-blue-600 hover:underline"
              onClick={() => setCurrentView('home')}
            >
              ← Back to Home
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

interface ServiceCardProps {
  title: string
  icon: string
  onClick: () => void
}

function ServiceCard({ title, icon, onClick }: ServiceCardProps) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow flex flex-col items-center"
    >
      <span className="text-4xl mb-2">{icon}</span>
      <span className="text-lg font-medium">{title}</span>
    </button>
  )
}

export default App
