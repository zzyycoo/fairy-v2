import { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import { Calendar, Clock, Users, Phone, Mail, Building, Globe, FileText, Download, Trash2, Save, Home, Lock, Unlock, KeyRound, Shield } from 'lucide-react'

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

// Service configurations
const SERVICE_CONFIG: Record<Service, { title: string; icon: string; fields: string[] }> = {
  room: { title: 'Room Booking', icon: '🛏️', fields: ['Check-in', 'Check-out', 'Guests', 'Room Type'] },
  car: { title: 'Car Rental', icon: '🚗', fields: ['Pick-up', 'Return', 'Location', 'Car Type'] },
  golf: { title: 'Golf Booking', icon: '⛳', fields: ['Date', 'Tee Time', 'Players', 'Course'] },
  bus: { title: 'Bus Booking', icon: '🚌', fields: ['Date', 'Departure', 'Route', 'Passengers'] },
}

// Simple encryption/decryption using XOR with password
function encrypt(data: string, password: string): string {
  if (!password) return data
  let result = ''
  for (let i = 0; i < data.length; i++) {
    result += String.fromCharCode(data.charCodeAt(i) ^ password.charCodeAt(i % password.length))
  }
  return btoa(result)
}

function decrypt(data: string, password: string): string {
  if (!password) return data
  try {
    const decoded = atob(data)
    let result = ''
    for (let i = 0; i < decoded.length; i++) {
      result += String.fromCharCode(decoded.charCodeAt(i) ^ password.charCodeAt(i % password.length))
    }
    return result
  } catch {
    return ''
  }
}

function App() {
  const [currentView, setCurrentView] = useState<'home' | 'booking' | 'bookings' | 'settings'>('home')
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLocked, setIsLocked] = useState(true)
  const [password, setPassword] = useState('')
  const [hasPassword, setHasPassword] = useState(false)
  const [showPasswordSetup, setShowPasswordSetup] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')

  // Check if password exists on mount
  useEffect(() => {
    const storedHash = localStorage.getItem('fairy-password-hash')
    setHasPassword(!!storedHash)
  }, [])

  // Load bookings (decrypted)
  const loadBookings = () => {
    const encrypted = localStorage.getItem('fairy-bookings')
    if (encrypted && password) {
      try {
        const decrypted = decrypt(encrypted, password)
        const data = JSON.parse(decrypted)
        setBookings(data)
      } catch {
        setBookings([])
      }
    } else {
      setBookings([])
    }
  }

  // Save bookings (encrypted)
  const saveBookings = (newBookings: Booking[]) => {
    if (!password) return
    const encrypted = encrypt(JSON.stringify(newBookings), password)
    localStorage.setItem('fairy-bookings', encrypted)
    setBookings(newBookings)
  }

  // Handle password submission
  const handlePasswordSubmit = () => {
    const storedHash = localStorage.getItem('fairy-password-hash')
    const inputHash = encrypt('verify', password)
    
    if (storedHash && storedHash !== inputHash) {
      setPasswordError('密码错误')
      return
    }
    
    setIsLocked(false)
    setPasswordError('')
    loadBookings()
  }

  // Setup new password
  const handlePasswordSetup = () => {
    if (newPassword.length < 4) {
      setPasswordError('密码至少4位')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('两次密码不一致')
      return
    }
    
    const hash = encrypt('verify', newPassword)
    localStorage.setItem('fairy-password-hash', hash)
    setPassword(newPassword)
    setHasPassword(true)
    setShowPasswordSetup(false)
    setNewPassword('')
    setConfirmPassword('')
    setIsLocked(false)
    
    // Migrate existing data with new password
    const oldData = localStorage.getItem('fairy-bookings-old')
    if (oldData) {
      try {
        const data = JSON.parse(oldData)
        saveBookings(data)
        localStorage.removeItem('fairy-bookings-old')
      } catch {}
    }
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

  // Lock app
  const handleLock = () => {
    setIsLocked(true)
    setPassword('')
    setBookings([])
  }

  // Password Setup Modal
  if (showPasswordSetup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <Shield className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900">设置密码</h2>
            <p className="text-gray-500">用于保护您的预订数据</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">新密码</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="至少4位"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">确认密码</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="再次输入密码"
              />
            </div>
            
            {passwordError && (
              <p className="text-red-500 text-sm">{passwordError}</p>
            )}
            
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { setShowPasswordSetup(false); setNewPassword(''); setConfirmPassword(''); setPasswordError('') }}
                className="flex-1 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handlePasswordSetup}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Lock Screen
  if (isLocked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <Lock className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900">Fairy 预订系统</h2>
            <p className="text-gray-500">{hasPassword ? '请输入密码解锁' : '欢迎使用'}</p>
          </div>
          
          {hasPassword ? (
            <div className="space-y-4">
              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-center"
                  placeholder="输入密码"
                  autoFocus
                />
              </div>
              
              {passwordError && (
                <p className="text-red-500 text-sm text-center">{passwordError}</p>
              )}
              
              <button
                onClick={handlePasswordSubmit}
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <Unlock size={20} /> 解锁
              </button>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-gray-600 mb-4">首次使用，请设置密码以保护您的数据</p>
              <button
                onClick={() => setShowPasswordSetup(true)}
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <KeyRound size={20} /> 设置密码
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🧚</span>
            <h1 className="text-2xl font-bold text-gray-900">Fairy 预订系统</h1>
          </div>
          <nav className="flex gap-2">
            <NavButton icon={<Home size={20} />} label="首页" active={currentView === 'home'} onClick={() => setCurrentView('home')} />
            <NavButton icon={<Calendar size={20} />} label="订单" active={currentView === 'bookings'} onClick={() => { loadBookings(); setCurrentView('bookings') }} />
            <NavButton icon={<Download size={20} />} label="导出" onClick={handleExportExcel} />
            <button
              onClick={handleLock}
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700"
              title="锁定"
            >
              <Lock size={20} />
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {currentView === 'home' && (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-semibold text-gray-800 mb-2">欢迎使用 Fairy</h2>
              <p className="text-gray-600">选择服务开始预订</p>
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
            
            {bookings.length > 0 && (
              <div className="mt-12 bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="text-blue-600" /> 最近订单
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-2">服务</th>
                        <th className="text-left py-3 px-2">日期</th>
                        <th className="text-left py-3 px-2">客人</th>
                        <th className="text-left py-3 px-2">人数</th>
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
                  查看全部 →
                </button>
              </div>
            )}
          </div>
        )}

        {currentView === 'booking' && selectedService && (
          <BookingForm
            service={selectedService}
            config={SERVICE_CONFIG[selectedService]}
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
        Fairy 预订系统 © {new Date().getFullYear()} | 数据已加密存储
      </footer>
    </div>
  )
}

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
      <span className="text-sm text-gray-500 mt-2">点击预订</span>
    </button>
  )
}

interface BookingFormProps {
  service: Service
  config: { title: string; icon: string; fields: string[] }
  onComplete: (booking: Omit<Booking, 'id' | 'createdAt'>) => void
  onCancel: () => void
}

function BookingForm({ service, config, onComplete, onCancel }: BookingFormProps) {
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    pax: 1,
    name: '',
    phone: '',
    email: '',
    company: '',
    country: 'Vietnam',
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              label={service === 'room' ? '入住日期' : service === 'car' ? '取车日期' : service === 'golf' ? '预订日期' : '出行日期'}
              type="date"
              value={formData.date}
              onChange={(v) => handleChange('date', v)}
              required
              icon={<Calendar size={18} />}
            />
            <FormInput
              label={service === 'room' ? '退房日期' : service === 'car' ? '还车日期' : service === 'golf' ? '人数' : '人数'}
              type={service === 'golf' || service === 'bus' ? 'number' : 'date'}
              value={service === 'golf' || service === 'bus' ? String(formData.pax) : formData.extraField1}
              onChange={(v) => service === 'golf' || service === 'bus' ? handleChange('pax', parseInt(v) || 1) : handleChange('extraField1', v)}
              required
              min={1}
              icon={<Users size={18} />}
            />
            <FormInput
              label={service === 'golf' ? '开球时间' : service === 'bus' ? '出发时间' : '首选时间'}
              type="time"
              value={formData.time}
              onChange={(v) => handleChange('time', v)}
              icon={<Clock size={18} />}
            />
            {service === 'room' && (
              <FormInput
                label="房型"
                type="select"
                value={formData.extraField2}
                onChange={(v) => handleChange('extraField2', v)}
                options={['标准间', '豪华间', '套房', '家庭套房']}
              />
            )}
            {service === 'car' && (
              <FormInput
                label="车型"
                type="select"
                value={formData.extraField2}
                onChange={(v) => handleChange('extraField2', v)}
                options={['轿车 (4座)', 'SUV (7座)', '小巴 (12座)', '豪华车']}
              />
            )}
            {service === 'golf' && (
              <FormInput
                label="球场"
                type="select"
                value={formData.extraField2}
                onChange={(v) => handleChange('extraField2', v)}
                options={['Dong Nai Golf', 'Song Be Golf', 'Long Thanh Golf', 'Twin Doves Golf']}
              />
            )}
            {service === 'bus' && (
              <FormInput
                label="路线"
                type="text"
                value={formData.extraField2}
                onChange={(v) => handleChange('extraField2', v)}
                placeholder="例如：酒店 - 机场"
              />
            )}
          </div>

          <hr className="my-4" />
          
          <h3 className="text-lg font-semibold text-gray-800 mb-4">客人信息</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              label="客人姓名"
              type="text"
              value={formData.name}
              onChange={(v) => handleChange('name', v)}
              required
              placeholder="姓名"
              icon={<Building size={18} />}
            />
            <FormInput
              label="电话"
              type="tel"
              value={formData.phone}
              onChange={(v) => handleChange('phone', v)}
              required
              placeholder="+84 xxx xxx xxx"
              icon={<Phone size={18} />}
            />
            <FormInput
              label="邮箱"
              type="email"
              value={formData.email}
              onChange={(v) => handleChange('email', v)}
              required
              placeholder="email@example.com"
              icon={<Mail size={18} />}
            />
            <FormInput
              label="公司"
              type="text"
              value={formData.company}
              onChange={(v) => handleChange('company', v)}
              placeholder="可选"
              icon={<Building size={18} />}
            />
            <FormInput
              label="国家"
              type="text"
              value={formData.country}
              onChange={(v) => handleChange('country', v)}
              icon={<Globe size={18} />}
            />
          </div>

          <FormInput
            label="备注"
            type="textarea"
            value={formData.notes}
            onChange={(v) => handleChange('notes', v)}
            placeholder="特殊要求或其他信息..."
            icon={<FileText size={18} />}
          />

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 px-6 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold flex items-center justify-center gap-2"
            >
              <Save className="inline" size={20} />
              确认预订
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

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
            <option value="">选择...</option>
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
        <h3 className="text-xl font-semibold text-gray-700 mb-2">暂无订单</h3>
        <p className="text-gray-500 mb-6">开始创建您的第一个预订</p>
        <button
          onClick={onBack}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          返回首页
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">全部订单 ({bookings.length})</h2>
        <div className="flex gap-2">
          <button
            onClick={onExport}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Download size={20} /> 导出Excel
          </button>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            返回
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
                      <span className="text-gray-500">日期:</span>
                      <p className="font-medium">{booking.date}</p>
                    </div>
                    {booking.time && (
                      <div>
                        <span className="text-gray-500">时间:</span>
                        <p className="font-medium">{booking.time}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-500">人数:</span>
                      <p className="font-medium">{booking.pax}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">客人:</span>
                      <p className="font-medium">{booking.guest.name}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">电话:</span>
                      <p className="font-medium">{booking.guest.phone}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">邮箱:</span>
                      <p className="font-medium">{booking.guest.email}</p>
                    </div>
                    {booking.guest.company && (
                      <div>
                        <span className="text-gray-500">公司:</span>
                        <p className="font-medium">{booking.guest.company}</p>
                      </div>
                    )}
                    {booking.guest.country && (
                      <div>
                        <span className="text-gray-500">国家:</span>
                        <p className="font-medium">{booking.guest.country}</p>
                      </div>
                    )}
                  </div>
                  {booking.notes && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-500 text-sm">备注:</span>
                      <p className="text-sm">{booking.notes}</p>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => onDelete(booking.id)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="删除订单"
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
