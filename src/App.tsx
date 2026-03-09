import { useState } from 'react'
import * as XLSX from 'xlsx'
import { Calendar, Clock, Users, Phone, Mail, Building, Globe, FileText, Download, Trash2, Save, Home } from 'lucide-react'

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
  id: string
  service: Service
  date: string
  time?: string
  pax: number
  guest: Guest
  notes?: string
  createdAt: string
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

// Service configurations
const SERVICE_CONFIG: Record<Service, { title: string; icon: string; fields: string[] }> = {
  room: { title: 'Room Booking', icon: '🛏️', fields: ['Check-in Date', 'Check-out Date', 'Number of Guests', 'Room Type'] },
  car: { title: 'Car Rental', icon: '🚗', fields: ['Pick-up Date', 'Return Date', 'Pick-up Location', 'Car Type'] },
  golf: { title: 'Golf Booking', icon: '⛳', fields: ['Booking Date', 'Tee Time', 'Number of Players', 'Course'] },
  bus: { title: 'Bus Booking', icon: '🚌', fields: ['Travel Date', 'Departure Time', 'Route', 'Number of Passengers'] },
}

function App() {
  const [currentView, setCurrentView] = useState<'home' | 'booking' | 'bookings' | 'settings'>('home')
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [settings, setSettings] = useState<GlobalSettings>({
    tripAuthorizer: '',
    defaultCountry: 'Vietnam'
  })

  // Load bookings from localStorage
  const loadBookings = () => {
    const saved = localStorage.getItem('fairy-bookings')
    if (saved) {
      setBookings(JSON.parse(saved))
    }
    const savedSettings = localStorage.getItem('fairy-settings')
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings))
    }
  }

  // Save bookings to localStorage
  const saveBookings = (newBookings: Booking[]) => {
    localStorage.setItem('fairy-bookings', JSON.stringify(newBookings))
    setBookings(newBookings)
  }

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service)
    setCurrentView('booking')
  }

  const handleBookingComplete = (booking: Omit<Booking, 'id' | 'createdAt'>) => {
    const newBookings = [...bookings, { ...booking, id: Date.now().toString(), createdAt: new Date().toISOString() }]
    saveBookings(newBookings)
    setCurrentView('bookings')
  }

  const handleDeleteBooking = (id: string) => {
    const newBookings = bookings.filter(b => b.id !== id)
    saveBookings(newBookings)
  }

  const handleExportExcel = () => {
    const exportData = bookings.map(b => ({
      'Service': b.service,
      'Date': b.date,
      'Time': b.time || '-',
      'Pax': b.pax,
      'Guest Name': b.guest.name,
      'Phone': b.guest.phone,
      'Email': b.guest.email,
      'Company': b.guest.company || '-',
      'Country': b.guest.country || '-',
      'Notes': b.notes || '-',
      'Created At': b.createdAt,
    }))
    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Bookings')
    XLSX.writeFile(wb, `fairy-bookings-${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  // Load data on mount
  useState(() => {
    loadBookings()
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🧚</span>
            <h1 className="text-2xl font-bold text-gray-900">Fairy Booking System</h1>
          </div>
          <nav className="flex gap-2">
            <NavButton icon={<Home size={20} />} label="Home" active={currentView === 'home'} onClick={() => setCurrentView('home')} />
            <NavButton icon={<Calendar size={20} />} label="Bookings" active={currentView === 'bookings'} onClick={() => { loadBookings(); setCurrentView('bookings') }} />
            <NavButton icon={<Download size={20} />} label="Export" onClick={handleExportExcel} />
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {currentView === 'home' && (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-semibold text-gray-800 mb-2">Welcome to Fairy</h2>
              <p className="text-gray-600">Select a service to start booking</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {(Object.keys(SERVICE_CONFIG) as Service[]).map((service) => (
                <ServiceCard
                  key={service}
                  title={SERVICE_CONFIG[service].title}
                  icon={SERVICE_CONFIG[service].icon}
                  onClick={() => handleServiceSelect(service)}
                />
              ))}
            </div>
            
            {/* Recent Bookings Preview */}
            {bookings.length > 0 && (
              <div className="mt-12 bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="text-blue-600" /> Recent Bookings
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-2">Service</th>
                        <th className="text-left py-3 px-2">Date</th>
                        <th className="text-left py-3 px-2">Guest</th>
                        <th className="text-left py-3 px-2">Pax</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.slice(-5).reverse().map(booking => (
                        <tr key={booking.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-2">{SERVICE_CONFIG[booking.service].icon} {SERVICE_CONFIG[booking.service].title}</td>
                          <td className="py-3 px-2">{booking.date}</td>
                          <td className="py-3 px-2">{booking.guest.name}</td>
                          <td className="py-3 px-2">{booking.pax}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button
                  onClick={() => { loadBookings(); setCurrentView('bookings') }}
                  className="mt-4 text-blue-600 hover:underline"
                >
                  View All Bookings →
                </button>
              </div>
            )}
          </div>
        )}

        {currentView === 'booking' && selectedService && (
          <BookingForm
            service={selectedService}
            config={SERVICE_CONFIG[selectedService]}
            settings={settings}
            onComplete={handleBookingComplete}
            onCancel={() => setCurrentView('home')}
          />
        )}

        {currentView === 'bookings' && (
          <BookingsList
            bookings={bookings}
            onDelete={handleDeleteBooking}
            onExport={handleExportExcel}
            onBack={() => setCurrentView('home')}
          />
        )}
      </main>

      <footer className="text-center py-6 text-gray-500 text-sm">
        Fairy Booking System © {new Date().getFullYear()}
      </footer>
    </div>
  )
}

// Navigation Button Component
function NavButton({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
        active ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-700'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}

// Service Card Component
interface ServiceCardProps {
  title: string
  icon: string
  onClick: () => void
}

function ServiceCard({ title, icon, onClick }: ServiceCardProps) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 p-8 flex flex-col items-center"
    >
      <span className="text-5xl mb-4">{icon}</span>
      <span className="text-xl font-semibold text-gray-800">{title}</span>
      <span className="text-sm text-gray-500 mt-2">Click to book</span>
    </button>
  )
}

// Booking Form Component
interface BookingFormProps {
  service: Service
  config: { title: string; icon: string; fields: string[] }
  settings: GlobalSettings
  onComplete: (booking: Omit<Booking, 'id' | 'createdAt'>) => void
  onCancel: () => void
}

function BookingForm({ service, config, settings, onComplete, onCancel }: BookingFormProps) {
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    pax: 1,
    name: '',
    phone: '',
    email: '',
    company: '',
    country: settings.defaultCountry,
    notes: '',
    extraField1: '',
    extraField2: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onComplete({
      service,
      date: formData.date,
      time: formData.time || undefined,
      pax: formData.pax,
      guest: {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        company: formData.company || undefined,
        country: formData.country || undefined,
      },
      notes: formData.notes || undefined,
    })
  }

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{config.icon}</span>
            <h2 className="text-2xl font-bold text-white">{config.title}</h2>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Service-specific fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              label={service === 'room' ? 'Check-in Date' : service === 'car' ? 'Pick-up Date' : service === 'golf' ? 'Booking Date' : 'Travel Date'}
              type="date"
              value={formData.date}
              onChange={(v) => handleChange('date', v)}
              required
              icon={<Calendar size={18} />}
            />
            <FormInput
              label={service === 'room' ? 'Check-out Date' : service === 'car' ? 'Return Date' : service === 'golf' ? 'Players' : 'Pax'}
              type={service === 'golf' || service === 'bus' ? 'number' : 'date'}
              value={service === 'golf' || service === 'bus' ? String(formData.pax) : formData.extraField1}
              onChange={(v) => service === 'golf' || service === 'bus' ? handleChange('pax', parseInt(v) || 1) : handleChange('extraField1', v)}
              required
              min={1}
              icon={<Users size={18} />}
            />
            <FormInput
              label={service === 'golf' ? 'Tee Time' : service === 'bus' ? 'Departure Time' : 'Preferred Time'}
              type="time"
              value={formData.time}
              onChange={(v) => handleChange('time', v)}
              icon={<Clock size={18} />}
            />
            {service === 'room' && (
              <FormInput
                label="Room Type"
                type="select"
                value={formData.extraField2}
                onChange={(v) => handleChange('extraField2', v)}
                options={['Standard', 'Deluxe', 'Suite', 'Family Suite']}
              />
            )}
            {service === 'car' && (
              <FormInput
                label="Car Type"
                type="select"
                value={formData.extraField2}
                onChange={(v) => handleChange('extraField2', v)}
                options={['Sedan (4 seats)', 'SUV (7 seats)', 'Minibus (12 seats)', 'Luxury Car']}
              />
            )}
            {service === 'golf' && (
              <FormInput
                label="Course"
                type="select"
                value={formData.extraField2}
                onChange={(v) => handleChange('extraField2', v)}
                options={['Dong Nai Golf', 'Song Be Golf', 'Long Thanh Golf', 'Twin Doves Golf']}
              />
            )}
            {service === 'bus' && (
              <FormInput
                label="Route"
                type="text"
                value={formData.extraField2}
                onChange={(v) => handleChange('extraField2', v)}
                placeholder="e.g., Hotel - Airport"
              />
            )}
          </div>

          <hr className="my-4" />
          
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Guest Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              label="Guest Name"
              type="text"
              value={formData.name}
              onChange={(v) => handleChange('name', v)}
              required
              placeholder="Full name"
              icon={<Building size={18} />}
            />
            <FormInput
              label="Phone Number"
              type="tel"
              value={formData.phone}
              onChange={(v) => handleChange('phone', v)}
              required
              placeholder="+84 xxx xxx xxx"
              icon={<Phone size={18} />}
            />
            <FormInput
              label="Email"
              type="email"
              value={formData.email}
              onChange={(v) => handleChange('email', v)}
              required
              placeholder="guest@email.com"
              icon={<Mail size={18} />}
            />
            <FormInput
              label="Company"
              type="text"
              value={formData.company}
              onChange={(v) => handleChange('company', v)}
              placeholder="Optional"
              icon={<Building size={18} />}
            />
            <FormInput
              label="Country"
              type="text"
              value={formData.country}
              onChange={(v) => handleChange('country', v)}
              icon={<Globe size={18} />}
            />
          </div>

          <FormInput
            label="Notes"
            type="textarea"
            value={formData.notes}
            onChange={(v) => handleChange('notes', v)}
            placeholder="Special requests or additional information..."
            icon={<FileText size={18} />}
          />

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 px-6 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold"
            >
              <Save className="inline-block mr-2" size={20} />
              Confirm Booking
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Form Input Component
interface FormInputProps {
  label: string
  type: 'text' | 'email' | 'tel' | 'date' | 'time' | 'number' | 'select' | 'textarea'
  value: string
  onChange: (value: string) => void
  required?: boolean
  placeholder?: string
  options?: string[]
  min?: number
  icon?: React.ReactNode
}

function FormInput({ label, type, value, onChange, required, placeholder, options, min, icon }: FormInputProps) {
  const inputClasses = "w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
  
  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}{required && <span className="text-red-500"> *</span>}</label>
      <div className="relative">
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</div>}
        {type === 'select' ? (
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={inputClasses}
            required={required}
          >
            <option value="">Select...</option>
            {options?.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        ) : type === 'textarea' ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={inputClasses + " min-h-[100px] resize-y"}
            placeholder={placeholder}
            rows={3}
          />
        ) : (
          <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={inputClasses}
            required={required}
            placeholder={placeholder}
            min={min}
          />
        )}
      </div>
    </div>
  )
}

// Bookings List Component
interface BookingsListProps {
  bookings: Booking[]
  onDelete: (id: string) => void
  onExport: () => void
  onBack: () => void
}

function BookingsList({ bookings, onDelete, onExport, onBack }: BookingsListProps) {
  if (bookings.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📋</div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">No Bookings Yet</h3>
        <p className="text-gray-500 mb-6">Start by creating your first booking</p>
        <button
          onClick={onBack}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Go to Home
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">All Bookings ({bookings.length})</h2>
        <div className="flex gap-2">
          <button
            onClick={onExport}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Download size={20} /> Export Excel
          </button>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Back
          </button>
        </div>
      </div>

      <div className="grid gap-4">
        {bookings.slice().reverse().map(booking => (
          <div key={booking.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <span className="text-3xl">{SERVICE_CONFIG[booking.service].icon}</span>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{SERVICE_CONFIG[booking.service].title}</h3>
                  <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2 text-sm">
                    <div>
                      <span className="text-gray-500">Date:</span>
                      <p className="font-medium">{booking.date}</p>
                    </div>
                    {booking.time && (
                      <div>
                        <span className="text-gray-500">Time:</span>
                        <p className="font-medium">{booking.time}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-500">Pax:</span>
                      <p className="font-medium">{booking.pax}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Guest:</span>
                      <p className="font-medium">{booking.guest.name}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Phone:</span>
                      <p className="font-medium">{booking.guest.phone}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Email:</span>
                      <p className="font-medium">{booking.guest.email}</p>
                    </div>
                    {booking.guest.company && (
                      <div>
                        <span className="text-gray-500">Company:</span>
                        <p className="font-medium">{booking.guest.company}</p>
                      </div>
                    )}
                    {booking.guest.country && (
                      <div>
                        <span className="text-gray-500">Country:</span>
                        <p className="font-medium">{booking.guest.country}</p>
                      </div>
                    )}
                  </div>
                  {booking.notes && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-500 text-sm">Notes:</span>
                      <p className="text-sm">{booking.notes}</p>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => onDelete(booking.id)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete booking"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default App
