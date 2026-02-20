'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { callAIAgent, type AIAgentResponse } from '@/lib/aiAgent'
import { cn } from '@/lib/utils'
// Card components available if needed via GlassCard wrapper
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  FiLoader, FiExternalLink, FiClock, FiCheckCircle, FiXCircle, FiAlertCircle,
  FiSearch, FiChevronRight, FiTrash2, FiX, FiPlus, FiSend, FiRefreshCw,
  FiGlobe, FiHash, FiCalendar, FiArrowLeft, FiMenu, FiFileText
} from 'react-icons/fi'
import {
  HiOutlineViewGrid, HiOutlinePlusCircle, HiOutlineClock, HiOutlineCog,
  HiOutlineSparkles
} from 'react-icons/hi'
import { BsPin } from 'react-icons/bs'

// ============================================================
// CONSTANTS
// ============================================================
const CONTENT_AGENT_ID = '6998907d2407a74739486761'
const SCHEDULER_AGENT_ID = '6998907df1c47561a67ba275'

const BOARDS = [
  'Home Decor', 'DIY Projects', 'Recipes', 'Fashion', 'Travel',
  'Fitness', 'Photography', 'Art & Design', 'Technology', 'Garden & Outdoor',
  'Wedding Ideas', 'Beauty & Style', 'Quotes & Inspiration', 'Kids & Parenting'
]

const TIMEZONES = [
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo',
  'Asia/Shanghai', 'Australia/Sydney', 'Pacific/Auckland'
]

type Screen = 'dashboard' | 'create' | 'confirmation' | 'history' | 'settings'

// ============================================================
// TYPES
// ============================================================
interface PinItem {
  id: string
  pin_title: string
  pin_description: string
  hashtags: string[]
  suggested_post_time: string
  source_url: string
  selectedBoard: string
  scheduledTime: string
  selected: boolean
}

interface PostResult {
  pin_title: string
  status: string
  board: string
  scheduled_time: string
  message: string
}

interface Campaign {
  id: string
  url: string
  page_title: string
  pin_count: number
  date: string
  status: 'posted' | 'scheduled' | 'failed' | 'draft'
  pins: PinItem[]
  results?: PostResult[]
  batch_id?: string
  summary?: string
}

interface AppSettings {
  defaultBoard: string
  defaultVariations: number
  timezone: string
}

interface AppStats {
  totalPosted: number
  totalScheduled: number
  totalDrafts: number
}

// ============================================================
// SAMPLE DATA
// ============================================================
const SAMPLE_PINS: PinItem[] = [
  {
    id: 'sample-1',
    pin_title: '10 Stunning Living Room Makeover Ideas for 2025',
    pin_description: 'Transform your living space with these trending interior design tips. From minimalist Scandinavian to bold maximalist -- find your perfect style. Includes budget-friendly DIY options that look expensive!',
    hashtags: ['#HomeDecor', '#InteriorDesign', '#LivingRoom', '#DIY', '#HomeStyle'],
    suggested_post_time: '2025-03-15T10:00:00Z',
    source_url: 'https://example.com/living-room-ideas',
    selectedBoard: 'Home Decor',
    scheduledTime: '2025-03-15T10:00',
    selected: true,
  },
  {
    id: 'sample-2',
    pin_title: 'Cozy Reading Nook Setup Guide',
    pin_description: 'Create the ultimate reading corner in any room. Layer textures, add warm lighting, and curate your book display for a Pinterest-worthy space. Perfect for small apartments and large homes alike.',
    hashtags: ['#ReadingNook', '#CozyHome', '#BookLover', '#HomeInspo'],
    suggested_post_time: '2025-03-15T14:00:00Z',
    source_url: 'https://example.com/living-room-ideas',
    selectedBoard: 'Home Decor',
    scheduledTime: '2025-03-15T14:00',
    selected: true,
  },
  {
    id: 'sample-3',
    pin_title: 'Budget-Friendly Accent Wall Techniques',
    pin_description: 'Learn 5 easy accent wall methods that cost under $50. From peel-and-stick wallpaper to geometric paint patterns, these ideas deliver maximum impact with minimal investment.',
    hashtags: ['#AccentWall', '#BudgetDecor', '#DIYHome', '#WallDecor'],
    suggested_post_time: '2025-03-16T09:00:00Z',
    source_url: 'https://example.com/living-room-ideas',
    selectedBoard: 'DIY Projects',
    scheduledTime: '2025-03-16T09:00',
    selected: false,
  },
]

const SAMPLE_CAMPAIGNS: Campaign[] = [
  {
    id: 'camp-1',
    url: 'https://example.com/living-room-ideas',
    page_title: '10 Stunning Living Room Ideas',
    pin_count: 3,
    date: '2025-02-18',
    status: 'posted',
    pins: [],
  },
  {
    id: 'camp-2',
    url: 'https://example.com/easy-recipes',
    page_title: 'Quick Weeknight Dinner Recipes',
    pin_count: 5,
    date: '2025-02-17',
    status: 'scheduled',
    pins: [],
  },
  {
    id: 'camp-3',
    url: 'https://example.com/garden-tips',
    page_title: 'Spring Garden Preparation Guide',
    pin_count: 2,
    date: '2025-02-15',
    status: 'failed',
    pins: [],
  },
]

const SAMPLE_POST_RESULTS: PostResult[] = [
  { pin_title: '10 Stunning Living Room Makeover Ideas for 2025', status: 'posted', board: 'Home Decor', scheduled_time: '2025-03-15T10:00:00Z', message: 'Successfully posted to Pinterest' },
  { pin_title: 'Cozy Reading Nook Setup Guide', status: 'scheduled', board: 'Home Decor', scheduled_time: '2025-03-15T14:00:00Z', message: 'Scheduled for posting' },
  { pin_title: 'Budget-Friendly Accent Wall Techniques', status: 'failed', board: 'DIY Projects', scheduled_time: '2025-03-16T09:00:00Z', message: 'Board not found. Please verify board name.' },
]

// ============================================================
// HELPERS
// ============================================================
function extractAgentData(result: AIAgentResponse): Record<string, any> | null {
  if (!result?.success) return null
  const resp = result.response
  if (!resp) return null
  const r = resp.result
  if (!r) return null
  if (r.result && typeof r.result === 'object' && !Array.isArray(r.result)) {
    return r.result
  }
  return r
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36)
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '--'
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return dateStr
  }
}

function formatDateTime(dateStr: string): string {
  if (!dateStr) return '--'
  try {
    const d = new Date(dateStr)
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
  } catch {
    return dateStr
  }
}

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const stored = localStorage.getItem(key)
    if (stored) return JSON.parse(stored) as T
  } catch { /* ignore */ }
  return fallback
}

function saveToStorage(key: string, value: unknown): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch { /* ignore */ }
}

function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-2">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### ')) return <h4 key={i} className="font-semibold text-sm mt-3 mb-1">{line.slice(4)}</h4>
        if (line.startsWith('## ')) return <h3 key={i} className="font-semibold text-base mt-3 mb-1">{line.slice(3)}</h3>
        if (line.startsWith('# ')) return <h2 key={i} className="font-bold text-lg mt-4 mb-2">{line.slice(2)}</h2>
        if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-4 list-disc text-sm">{formatInline(line.slice(2))}</li>
        if (/^\d+\.\s/.test(line)) return <li key={i} className="ml-4 list-decimal text-sm">{formatInline(line.replace(/^\d+\.\s/, ''))}</li>
        if (!line.trim()) return <div key={i} className="h-1" />
        return <p key={i} className="text-sm">{formatInline(line)}</p>
      })}
    </div>
  )
}

function formatInline(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i} className="font-semibold">{part}</strong> : part
  )
}

// ============================================================
// GLASS CARD WRAPPER
// ============================================================
function GlassCard({ children, className, ...props }: { children: React.ReactNode; className?: string; [key: string]: unknown }) {
  return (
    <div className={cn('backdrop-blur-md bg-card/75 border border-white/[0.18] shadow-md rounded-[0.875rem]', className)} {...props}>
      {children}
    </div>
  )
}

// ============================================================
// SKELETON CARDS
// ============================================================
function PinSkeleton() {
  return (
    <GlassCard className="p-6 space-y-4">
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-16 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-9 w-36" />
      </div>
    </GlassCard>
  )
}

// ============================================================
// STAT CARD
// ============================================================
function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <GlassCard className="p-6">
      <div className="flex items-center gap-4">
        <div className={cn('w-12 h-12 rounded-[0.875rem] flex items-center justify-center', color)}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </div>
    </GlassCard>
  )
}

// ============================================================
// STATUS BADGE
// ============================================================
function StatusBadge({ status }: { status: string }) {
  const normalized = (status ?? '').toLowerCase()
  if (normalized === 'posted' || normalized === 'success') {
    return <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100 gap-1"><FiCheckCircle className="w-3 h-3" />Posted</Badge>
  }
  if (normalized === 'scheduled') {
    return <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100 gap-1"><FiClock className="w-3 h-3" />Scheduled</Badge>
  }
  if (normalized === 'failed' || normalized === 'error') {
    return <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100 gap-1"><FiXCircle className="w-3 h-3" />Failed</Badge>
  }
  if (normalized === 'draft') {
    return <Badge className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100 gap-1"><FiFileText className="w-3 h-3" />Draft</Badge>
  }
  return <Badge variant="secondary">{status}</Badge>
}

// ============================================================
// AGENT STATUS PANEL
// ============================================================
function AgentStatusPanel({ activeAgentId }: { activeAgentId: string | null }) {
  const agents = [
    { id: CONTENT_AGENT_ID, name: 'Content Extraction & Pin Generator', purpose: 'Extracts content from URLs and generates Pinterest pin variations' },
    { id: SCHEDULER_AGENT_ID, name: 'Pin Scheduler & Poster', purpose: 'Schedules and posts approved pins to Pinterest' },
  ]
  return (
    <GlassCard className="p-4 mt-6">
      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><HiOutlineSparkles className="w-4 h-4 text-primary" />Agent Status</h3>
      <div className="space-y-2">
        {agents.map(a => (
          <div key={a.id} className="flex items-start gap-3 p-2 rounded-lg bg-background/50">
            <div className={cn('w-2 h-2 rounded-full mt-1.5 flex-shrink-0', activeAgentId === a.id ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground/30')} />
            <div className="min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{a.name}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{a.purpose}</p>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  )
}

// ============================================================
// PIN CARD (EDITABLE)
// ============================================================
function PinCard({
  pin,
  onUpdate,
  onRemove,
}: {
  pin: PinItem
  onUpdate: (id: string, updates: Partial<PinItem>) => void
  onRemove: (id: string) => void
}) {
  const [newTag, setNewTag] = useState('')

  const addHashtag = () => {
    if (!newTag.trim()) return
    const tag = newTag.trim().startsWith('#') ? newTag.trim() : `#${newTag.trim()}`
    const current = Array.isArray(pin.hashtags) ? pin.hashtags : []
    if (!current.includes(tag)) {
      onUpdate(pin.id, { hashtags: [...current, tag] })
    }
    setNewTag('')
  }

  const removeHashtag = (tag: string) => {
    const current = Array.isArray(pin.hashtags) ? pin.hashtags : []
    onUpdate(pin.id, { hashtags: current.filter(t => t !== tag) })
  }

  return (
    <GlassCard className={cn('p-5 transition-all duration-300', pin.selected ? 'ring-2 ring-primary/50' : 'opacity-80')}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={pin.selected}
            onCheckedChange={(checked) => onUpdate(pin.id, { selected: Boolean(checked) })}
          />
          <Badge variant="outline" className="text-xs">Pin</Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={() => onRemove(pin.id)} className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive">
          <FiTrash2 className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Title</Label>
          <Input
            value={pin.pin_title ?? ''}
            onChange={(e) => onUpdate(pin.id, { pin_title: e.target.value })}
            className="font-medium"
          />
        </div>

        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Description</Label>
          <Textarea
            value={pin.pin_description ?? ''}
            onChange={(e) => onUpdate(pin.id, { pin_description: e.target.value })}
            rows={3}
            className="text-sm resize-none"
          />
        </div>

        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Hashtags</Label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {Array.isArray(pin.hashtags) && pin.hashtags.map((tag, i) => (
              <Badge key={i} variant="secondary" className="gap-1 pr-1 text-xs">
                {tag}
                <button onClick={() => removeHashtag(tag)} className="ml-1 hover:text-destructive transition-colors">
                  <FiX className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addHashtag() } }}
              placeholder="Add hashtag..."
              className="text-xs h-8"
            />
            <Button variant="outline" size="sm" onClick={addHashtag} className="h-8 px-2">
              <FiPlus className="w-3 h-3" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Board</Label>
            <Select value={pin.selectedBoard} onValueChange={(val) => onUpdate(pin.id, { selectedBoard: val })}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Select board..." />
              </SelectTrigger>
              <SelectContent>
                {BOARDS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Schedule</Label>
            <Input
              type="datetime-local"
              value={pin.scheduledTime ?? ''}
              onChange={(e) => onUpdate(pin.id, { scheduledTime: e.target.value })}
              className="h-9 text-xs"
            />
          </div>
        </div>
      </div>
    </GlassCard>
  )
}

// ============================================================
// ERROR BOUNDARY
// ============================================================
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4 text-sm">{this.state.error}</p>
            <button onClick={() => this.setState({ hasError: false, error: '' })} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm">
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// ============================================================
// MAIN PAGE
// ============================================================
export default function Page() {
  // --------------- State ---------------
  const [screen, setScreen] = useState<Screen>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sampleMode, setSampleMode] = useState(false)
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)

  // Dashboard
  const [url, setUrl] = useState('')
  const [numVariations, setNumVariations] = useState(3)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generateError, setGenerateError] = useState('')
  const [generateStatus, setGenerateStatus] = useState('')

  // Create / Edit Pins
  const [pins, setPins] = useState<PinItem[]>([])
  const [sourceInfo, setSourceInfo] = useState<{ url: string; title: string; summary: string } | null>(null)
  const [bulkBoard, setBulkBoard] = useState('')
  const [bulkTime, setBulkTime] = useState('')

  // Confirmation
  const [postResults, setPostResults] = useState<PostResult[]>([])
  const [postSummary, setPostSummary] = useState<{ total: number; successful: number; failed: number; scheduled: number; batch_id: string; summary: string }>({ total: 0, successful: 0, failed: 0, scheduled: 0, batch_id: '', summary: '' })
  const [isPosting, setIsPosting] = useState(false)
  const [postError, setPostError] = useState('')
  const [postStatus, setPostStatus] = useState('')

  // History & Settings
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [settings, setSettings] = useState<AppSettings>({ defaultBoard: 'Home Decor', defaultVariations: 3, timezone: 'America/New_York' })
  const [stats, setStats] = useState<AppStats>({ totalPosted: 0, totalScheduled: 0, totalDrafts: 0 })
  const [historyFilter, setHistoryFilter] = useState('all')
  const [historySearch, setHistorySearch] = useState('')
  const [settingsSaved, setSettingsSaved] = useState(false)

  // --------------- Load from localStorage ---------------
  useEffect(() => {
    setCampaigns(loadFromStorage<Campaign[]>('pinbot_campaigns', []))
    setSettings(loadFromStorage<AppSettings>('pinbot_settings', { defaultBoard: 'Home Decor', defaultVariations: 3, timezone: 'America/New_York' }))
    setStats(loadFromStorage<AppStats>('pinbot_stats', { totalPosted: 0, totalScheduled: 0, totalDrafts: 0 }))
  }, [])

  // --------------- Persist ---------------
  const saveCampaigns = useCallback((c: Campaign[]) => {
    setCampaigns(c)
    saveToStorage('pinbot_campaigns', c)
  }, [])

  const saveStats = useCallback((s: AppStats) => {
    setStats(s)
    saveToStorage('pinbot_stats', s)
  }, [])

  const saveSettings = useCallback((s: AppSettings) => {
    setSettings(s)
    saveToStorage('pinbot_settings', s)
  }, [])

  // --------------- Generate Pins (Agent 1) ---------------
  const handleGeneratePins = useCallback(async () => {
    const targetUrl = url.trim()
    if (!targetUrl) {
      setGenerateError('Please enter a URL to generate pins from.')
      return
    }
    setGenerateError('')
    setGenerateStatus('Extracting content and generating pins...')
    setIsGenerating(true)
    setActiveAgentId(CONTENT_AGENT_ID)

    try {
      const message = `Extract content and generate ${numVariations} Pinterest pin variations from this URL: ${targetUrl}`
      const result = await callAIAgent(message, CONTENT_AGENT_ID)

      if (result.success) {
        const data = extractAgentData(result)
        if (!data) {
          setGenerateError('Received an empty response from the agent. Please try again.')
          setGenerateStatus('')
          setIsGenerating(false)
          setActiveAgentId(null)
          return
        }

        const rawPins = Array.isArray(data?.pins) ? data.pins : []
        const mappedPins: PinItem[] = rawPins.map((p: Record<string, any>, idx: number) => ({
          id: generateId(),
          pin_title: p?.pin_title ?? `Pin ${idx + 1}`,
          pin_description: p?.pin_description ?? '',
          hashtags: Array.isArray(p?.hashtags) ? p.hashtags : [],
          suggested_post_time: p?.suggested_post_time ?? '',
          source_url: p?.source_url ?? targetUrl,
          selectedBoard: settings.defaultBoard,
          scheduledTime: p?.suggested_post_time ? p.suggested_post_time.replace('Z', '').slice(0, 16) : '',
          selected: true,
        }))

        setPins(mappedPins)
        setSourceInfo({
          url: data?.source_url ?? targetUrl,
          title: data?.page_title ?? 'Untitled Page',
          summary: data?.page_summary ?? '',
        })

        // Update stats
        const newStats = { ...stats, totalDrafts: stats.totalDrafts + mappedPins.length }
        saveStats(newStats)

        setGenerateStatus(`Generated ${mappedPins.length} pins successfully!`)
        setScreen('create')
      } else {
        setGenerateError(result.error ?? 'Failed to generate pins. Please try again.')
        setGenerateStatus('')
      }
    } catch (err) {
      setGenerateError('An unexpected error occurred. Please try again.')
      setGenerateStatus('')
    } finally {
      setIsGenerating(false)
      setActiveAgentId(null)
    }
  }, [url, numVariations, settings.defaultBoard, stats, saveStats])

  // --------------- Schedule & Post (Agent 2) ---------------
  const handleSchedulePost = useCallback(async () => {
    const selectedPins = pins.filter(p => p.selected)
    if (selectedPins.length === 0) return

    setPostError('')
    setPostStatus('Scheduling and posting pins...')
    setIsPosting(true)
    setActiveAgentId(SCHEDULER_AGENT_ID)

    try {
      const approvedPins = selectedPins.map(pin => ({
        pin_title: pin.pin_title,
        pin_description: pin.pin_description,
        hashtags: pin.hashtags,
        board: pin.selectedBoard,
        scheduled_time: pin.scheduledTime,
      }))

      const message = `Post/schedule these approved Pinterest pins: ${JSON.stringify({ pins: approvedPins })}`
      const result = await callAIAgent(message, SCHEDULER_AGENT_ID)

      if (result.success) {
        const data = extractAgentData(result)
        const results = Array.isArray(data?.results) ? data.results : []
        const mappedResults: PostResult[] = results.map((r: Record<string, any>) => ({
          pin_title: r?.pin_title ?? 'Unknown',
          status: r?.status ?? 'unknown',
          board: r?.board ?? '',
          scheduled_time: r?.scheduled_time ?? '',
          message: r?.message ?? '',
        }))

        setPostResults(mappedResults)
        setPostSummary({
          total: data?.total_pins ?? selectedPins.length,
          successful: data?.successful ?? 0,
          failed: data?.failed ?? 0,
          scheduled: data?.scheduled ?? 0,
          batch_id: data?.batch_id ?? '',
          summary: data?.summary ?? '',
        })

        // Save campaign
        const newCampaign: Campaign = {
          id: generateId(),
          url: sourceInfo?.url ?? url,
          page_title: sourceInfo?.title ?? 'Campaign',
          pin_count: selectedPins.length,
          date: new Date().toISOString().slice(0, 10),
          status: (data?.failed ?? 0) > 0 ? 'failed' : (data?.scheduled ?? 0) > 0 ? 'scheduled' : 'posted',
          pins: selectedPins,
          results: mappedResults,
          batch_id: data?.batch_id ?? '',
          summary: data?.summary ?? '',
        }
        const updatedCampaigns = [newCampaign, ...campaigns]
        saveCampaigns(updatedCampaigns)

        // Update stats
        const newStats = {
          totalPosted: stats.totalPosted + (data?.successful ?? 0),
          totalScheduled: stats.totalScheduled + (data?.scheduled ?? 0),
          totalDrafts: Math.max(0, stats.totalDrafts - selectedPins.length),
        }
        saveStats(newStats)

        setPostStatus('Pins processed successfully!')
        setScreen('confirmation')
      } else {
        setPostError(result.error ?? 'Failed to schedule pins. Please try again.')
        setPostStatus('')
      }
    } catch (err) {
      setPostError('An unexpected error occurred. Please try again.')
      setPostStatus('')
    } finally {
      setIsPosting(false)
      setActiveAgentId(null)
    }
  }, [pins, sourceInfo, url, campaigns, stats, saveCampaigns, saveStats])

  // --------------- Pin Update Helpers ---------------
  const updatePin = useCallback((id: string, updates: Partial<PinItem>) => {
    setPins(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))
  }, [])

  const removePin = useCallback((id: string) => {
    setPins(prev => prev.filter(p => p.id !== id))
  }, [])

  const selectAllPins = useCallback((selected: boolean) => {
    setPins(prev => prev.map(p => ({ ...p, selected })))
  }, [])

  const applyBulkBoard = useCallback(() => {
    if (!bulkBoard) return
    setPins(prev => prev.map(p => p.selected ? { ...p, selectedBoard: bulkBoard } : p))
  }, [bulkBoard])

  const applyBulkTime = useCallback(() => {
    if (!bulkTime) return
    setPins(prev => prev.map(p => p.selected ? { ...p, scheduledTime: bulkTime } : p))
  }, [bulkTime])

  // --------------- Computed ---------------
  const selectedCount = pins.filter(p => p.selected).length
  const displayCampaigns = sampleMode ? SAMPLE_CAMPAIGNS : campaigns
  const displayStats = sampleMode ? { totalPosted: 12, totalScheduled: 5, totalDrafts: 3 } : stats
  const displayPins = sampleMode && screen === 'create' && pins.length === 0 ? SAMPLE_PINS : pins
  const displayResults = sampleMode && screen === 'confirmation' && postResults.length === 0 ? SAMPLE_POST_RESULTS : postResults

  const filteredCampaigns = displayCampaigns.filter(c => {
    if (historyFilter !== 'all' && c.status !== historyFilter) return false
    if (historySearch.trim()) {
      const q = historySearch.toLowerCase()
      return (c.page_title ?? '').toLowerCase().includes(q) || (c.url ?? '').toLowerCase().includes(q)
    }
    return true
  })

  // --------------- Navigation ---------------
  const navItems: { id: Screen; icon: React.ReactNode; label: string }[] = [
    { id: 'dashboard', icon: <HiOutlineViewGrid className="w-5 h-5" />, label: 'Dashboard' },
    { id: 'create', icon: <HiOutlinePlusCircle className="w-5 h-5" />, label: 'Create Pins' },
    { id: 'history', icon: <HiOutlineClock className="w-5 h-5" />, label: 'Pin History' },
    { id: 'settings', icon: <HiOutlineCog className="w-5 h-5" />, label: 'Settings' },
  ]

  // ============================================================
  // RENDER: SIDEBAR
  // ============================================================
  const renderSidebar = () => (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <aside className={cn(
        'fixed top-0 left-0 z-50 h-full w-64 flex flex-col border-r border-border transition-transform duration-300 lg:translate-x-0',
        'bg-[hsl(30,38%,95%)]',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Logo */}
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-[0.875rem] bg-primary flex items-center justify-center shadow-md">
            <BsPin className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground" style={{ letterSpacing: '-0.01em' }}>PinBot</h1>
            <p className="text-xs text-muted-foreground">Pinterest Automation</p>
          </div>
        </div>

        <Separator />

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => { setScreen(item.id); setSidebarOpen(false) }}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-[0.875rem] text-sm font-medium transition-all duration-200',
                screen === item.id
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        {/* Agent Status */}
        <div className="p-4">
          <AgentStatusPanel activeAgentId={activeAgentId} />
        </div>
      </aside>
    </>
  )

  // ============================================================
  // RENDER: DASHBOARD SCREEN
  // ============================================================
  const renderDashboard = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground" style={{ letterSpacing: '-0.01em' }}>Dashboard</h2>
        <p className="text-sm text-muted-foreground mt-1">Manage your Pinterest pin campaigns</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={<FiCheckCircle className="w-6 h-6 text-green-600" />} label="Pins Posted" value={displayStats.totalPosted} color="bg-green-100" />
        <StatCard icon={<FiClock className="w-6 h-6 text-amber-600" />} label="Scheduled" value={displayStats.totalScheduled} color="bg-amber-100" />
        <StatCard icon={<FiFileText className="w-6 h-6 text-blue-600" />} label="Drafts" value={displayStats.totalDrafts} color="bg-blue-100" />
      </div>

      {/* Create New Pins */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-[0.875rem] bg-primary/10 flex items-center justify-center">
            <HiOutlineSparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Create New Pins</h3>
            <p className="text-xs text-muted-foreground">Paste a URL to automatically generate pin ideas</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/your-article"
              className="h-11"
              onKeyDown={(e) => { if (e.key === 'Enter') handleGeneratePins() }}
            />
          </div>
          <Select value={String(numVariations)} onValueChange={(v) => setNumVariations(Number(v))}>
            <SelectTrigger className="w-32 h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                <SelectItem key={n} value={String(n)}>{n} {n === 1 ? 'pin' : 'pins'}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleGeneratePins} disabled={isGenerating || !url.trim()} className="h-11 px-6 gap-2">
            {isGenerating ? <><FiLoader className="w-4 h-4 animate-spin" />Generating...</> : <><HiOutlinePlusCircle className="w-4 h-4" />Generate Pins</>}
          </Button>
        </div>

        {generateError && (
          <div className="mt-3 flex items-center gap-2 text-sm text-destructive bg-destructive/10 px-4 py-2 rounded-lg">
            <FiAlertCircle className="w-4 h-4 flex-shrink-0" />{generateError}
          </div>
        )}
        {generateStatus && !generateError && (
          <div className="mt-3 flex items-center gap-2 text-sm text-primary bg-primary/10 px-4 py-2 rounded-lg">
            {isGenerating ? <FiLoader className="w-4 h-4 animate-spin flex-shrink-0" /> : <FiCheckCircle className="w-4 h-4 flex-shrink-0" />}{generateStatus}
          </div>
        )}
      </GlassCard>

      {/* Recent Campaigns */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Recent Campaigns</h3>
          {displayCampaigns.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setScreen('history')} className="gap-1 text-xs">
              View All <FiChevronRight className="w-3 h-3" />
            </Button>
          )}
        </div>

        {displayCampaigns.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <BsPin className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No pins yet -- paste a URL above to get started!</p>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {displayCampaigns.slice(0, 5).map(c => (
              <GlassCard key={c.id} className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-[0.875rem] bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FiGlobe className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{c.page_title ?? 'Untitled'}</p>
                  <p className="text-xs text-muted-foreground truncate">{c.url}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs text-muted-foreground hidden sm:block">{c.pin_count} {c.pin_count === 1 ? 'pin' : 'pins'}</span>
                  <span className="text-xs text-muted-foreground hidden sm:block">{formatDate(c.date)}</span>
                  <StatusBadge status={c.status} />
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  // ============================================================
  // RENDER: CREATE PINS SCREEN
  // ============================================================
  const renderCreatePins = () => {
    const currentPins = displayPins

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground" style={{ letterSpacing: '-0.01em' }}>
              {currentPins.length > 0 ? 'Review & Edit Pins' : 'Create Pins'}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {currentPins.length > 0 ? `${currentPins.length} pins generated - edit and select pins to post` : 'Generate pins from a URL to get started'}
            </p>
          </div>
          {currentPins.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => { setPins([]); setSourceInfo(null); setScreen('dashboard') }} className="gap-1">
              <FiArrowLeft className="w-4 h-4" /> Back
            </Button>
          )}
        </div>

        {/* Source Info */}
        {sourceInfo && (
          <GlassCard className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-[0.875rem] bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <FiGlobe className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-foreground text-sm">{sourceInfo.title}</h3>
                <a href={sourceInfo.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1 mt-0.5">
                  {sourceInfo.url} <FiExternalLink className="w-3 h-3" />
                </a>
                {sourceInfo.summary && (
                  <div className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {renderMarkdown(sourceInfo.summary)}
                  </div>
                )}
              </div>
            </div>
          </GlassCard>
        )}

        {/* Loading state */}
        {isGenerating && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-primary">
              <FiLoader className="w-4 h-4 animate-spin" /> Extracting content and generating pins...
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3].map(i => <PinSkeleton key={i} />)}
            </div>
          </div>
        )}

        {/* No pins yet */}
        {!isGenerating && currentPins.length === 0 && (
          <GlassCard className="p-8 text-center">
            <BsPin className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-sm text-muted-foreground mb-4">No pins generated yet. Go to Dashboard to enter a URL and generate pins.</p>
            <Button variant="outline" onClick={() => setScreen('dashboard')} className="gap-2">
              <FiArrowLeft className="w-4 h-4" /> Go to Dashboard
            </Button>
          </GlassCard>
        )}

        {/* Bulk Actions */}
        {currentPins.length > 0 && (
          <>
            <GlassCard className="p-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 mr-2">
                  <Checkbox
                    checked={currentPins.length > 0 && currentPins.every(p => p.selected)}
                    onCheckedChange={(checked) => selectAllPins(Boolean(checked))}
                  />
                  <Label className="text-sm font-medium cursor-pointer">Select All ({selectedCount}/{currentPins.length})</Label>
                </div>
                <Separator orientation="vertical" className="h-6" />
                <div className="flex items-center gap-2">
                  <Select value={bulkBoard} onValueChange={setBulkBoard}>
                    <SelectTrigger className="h-8 text-xs w-36">
                      <SelectValue placeholder="Board for all..." />
                    </SelectTrigger>
                    <SelectContent>
                      {BOARDS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={applyBulkBoard} disabled={!bulkBoard} className="h-8 text-xs">Apply</Button>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="datetime-local"
                    value={bulkTime}
                    onChange={(e) => setBulkTime(e.target.value)}
                    className="h-8 text-xs w-44"
                  />
                  <Button variant="outline" size="sm" onClick={applyBulkTime} disabled={!bulkTime} className="h-8 text-xs">Apply</Button>
                </div>
              </div>
            </GlassCard>

            {/* Pin Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentPins.map(pin => (
                <PinCard key={pin.id} pin={pin} onUpdate={updatePin} onRemove={removePin} />
              ))}
            </div>

            {/* Post/Schedule Button */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <div className="text-sm text-muted-foreground">
                {selectedCount} of {currentPins.length} pins selected
              </div>
              <Button onClick={handleSchedulePost} disabled={selectedCount === 0 || isPosting} className="gap-2 px-8 h-11">
                {isPosting ? <><FiLoader className="w-4 h-4 animate-spin" />Posting...</> : <><FiSend className="w-4 h-4" />Schedule & Post ({selectedCount})</>}
              </Button>
            </div>

            {postError && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 px-4 py-2 rounded-lg">
                <FiAlertCircle className="w-4 h-4 flex-shrink-0" />{postError}
              </div>
            )}
            {postStatus && !postError && (
              <div className="flex items-center gap-2 text-sm text-primary bg-primary/10 px-4 py-2 rounded-lg">
                {isPosting ? <FiLoader className="w-4 h-4 animate-spin flex-shrink-0" /> : <FiCheckCircle className="w-4 h-4 flex-shrink-0" />}{postStatus}
              </div>
            )}
          </>
        )}
      </div>
    )
  }

  // ============================================================
  // RENDER: CONFIRMATION SCREEN
  // ============================================================
  const renderConfirmation = () => {
    const results = displayResults
    const summaryData = sampleMode && postResults.length === 0
      ? { total: 3, successful: 1, failed: 1, scheduled: 1, batch_id: 'BATCH-SAMPLE-001', summary: 'Processed 3 pins: 1 posted immediately, 1 scheduled, 1 failed due to board not found.' }
      : postSummary

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground" style={{ letterSpacing: '-0.01em' }}>Posting Results</h2>
            <p className="text-sm text-muted-foreground mt-1">Review the status of your posted and scheduled pins</p>
          </div>
          <Button variant="outline" onClick={() => { setScreen('dashboard'); setPins([]); setSourceInfo(null); setPostResults([]); setUrl(''); setGenerateStatus(''); setPostStatus('') }}>
            <FiArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
          </Button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <GlassCard className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{summaryData.total}</p>
            <p className="text-xs text-muted-foreground">Total Pins</p>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{summaryData.successful}</p>
            <p className="text-xs text-muted-foreground">Posted</p>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{summaryData.scheduled}</p>
            <p className="text-xs text-muted-foreground">Scheduled</p>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{summaryData.failed}</p>
            <p className="text-xs text-muted-foreground">Failed</p>
          </GlassCard>
        </div>

        {/* Batch ID & Summary */}
        {summaryData.batch_id && (
          <GlassCard className="p-4">
            <div className="flex items-start gap-3">
              <FiHash className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Batch ID</p>
                <p className="text-sm font-mono text-foreground">{summaryData.batch_id}</p>
              </div>
            </div>
            {summaryData.summary && (
              <div className="mt-3 pt-3 border-t border-border">
                <div className="text-sm text-muted-foreground leading-relaxed">{renderMarkdown(summaryData.summary)}</div>
              </div>
            )}
          </GlassCard>
        )}

        {/* Progress */}
        {summaryData.total > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Success rate</span>
              <span>{Math.round(((summaryData.successful + summaryData.scheduled) / summaryData.total) * 100)}%</span>
            </div>
            <Progress value={((summaryData.successful + summaryData.scheduled) / summaryData.total) * 100} className="h-2" />
          </div>
        )}

        {/* Results List */}
        <div className="space-y-3">
          {results.map((r, i) => {
            const normalizedStatus = (r.status ?? '').toLowerCase()
            return (
              <GlassCard key={i} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{r.pin_title ?? 'Untitled Pin'}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                      {r.board && <span className="flex items-center gap-1"><BsPin className="w-3 h-3" />{r.board}</span>}
                      {r.scheduled_time && <span className="flex items-center gap-1"><FiCalendar className="w-3 h-3" />{formatDateTime(r.scheduled_time)}</span>}
                    </div>
                    {r.message && (
                      <p className={cn('text-xs mt-2', normalizedStatus === 'failed' || normalizedStatus === 'error' ? 'text-destructive' : 'text-muted-foreground')}>
                        {r.message}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusBadge status={r.status} />
                    {(normalizedStatus === 'failed' || normalizedStatus === 'error') && (
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                        <FiRefreshCw className="w-3 h-3" /> Retry
                      </Button>
                    )}
                  </div>
                </div>
              </GlassCard>
            )
          })}
        </div>

        {results.length === 0 && (
          <GlassCard className="p-8 text-center">
            <p className="text-sm text-muted-foreground">No results to display.</p>
          </GlassCard>
        )}
      </div>
    )
  }

  // ============================================================
  // RENDER: HISTORY SCREEN
  // ============================================================
  const renderHistory = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground" style={{ letterSpacing: '-0.01em' }}>Pin History</h2>
        <p className="text-sm text-muted-foreground mt-1">Browse and search your past pin campaigns</p>
      </div>

      {/* Filters */}
      <GlassCard className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              placeholder="Search by title or URL..."
              className="pl-9 h-9"
            />
          </div>
          <Tabs value={historyFilter} onValueChange={setHistoryFilter} className="w-auto">
            <TabsList className="h-9">
              <TabsTrigger value="all" className="text-xs px-3">All</TabsTrigger>
              <TabsTrigger value="posted" className="text-xs px-3">Posted</TabsTrigger>
              <TabsTrigger value="scheduled" className="text-xs px-3">Scheduled</TabsTrigger>
              <TabsTrigger value="failed" className="text-xs px-3">Failed</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </GlassCard>

      {/* Campaign List */}
      {filteredCampaigns.length === 0 ? (
        <GlassCard className="p-8 text-center">
          <HiOutlineClock className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            {displayCampaigns.length === 0 ? 'No campaign history yet. Create your first pins to get started!' : 'No campaigns match your search.'}
          </p>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {filteredCampaigns.map(c => (
            <GlassCard key={c.id} className="p-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-[0.875rem] bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <FiGlobe className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{c.page_title ?? 'Untitled Campaign'}</p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{c.url}</p>
                    </div>
                    <StatusBadge status={c.status} />
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><BsPin className="w-3 h-3" />{c.pin_count} {c.pin_count === 1 ? 'pin' : 'pins'}</span>
                    <span className="flex items-center gap-1"><FiCalendar className="w-3 h-3" />{formatDate(c.date)}</span>
                    {c.batch_id && <span className="flex items-center gap-1 font-mono"><FiHash className="w-3 h-3" />{c.batch_id}</span>}
                  </div>
                  {c.summary && (
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{c.summary}</p>
                  )}
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  )

  // ============================================================
  // RENDER: SETTINGS SCREEN
  // ============================================================
  const renderSettings = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground" style={{ letterSpacing: '-0.01em' }}>Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">Configure your PinBot preferences</p>
      </div>

      {/* Pinterest Connection */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[0.875rem] bg-red-100 flex items-center justify-center">
            <BsPin className="w-6 h-6 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">Pinterest Account</h3>
            <p className="text-xs text-muted-foreground">Connection managed by agent integration</p>
          </div>
          <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100 gap-1">
            <FiCheckCircle className="w-3 h-3" /> Connected
          </Badge>
        </div>
      </GlassCard>

      {/* Default Board */}
      <GlassCard className="p-6 space-y-4">
        <h3 className="font-semibold text-foreground">Default Settings</h3>

        <div className="space-y-2">
          <Label className="text-sm">Default Board</Label>
          <Select value={settings.defaultBoard} onValueChange={(v) => setSettings(prev => ({ ...prev, defaultBoard: v }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BOARDS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">New pins will default to this board</p>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label className="text-sm">Default Pin Variations</Label>
          <Select value={String(settings.defaultVariations)} onValueChange={(v) => setSettings(prev => ({ ...prev, defaultVariations: Number(v) }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                <SelectItem key={n} value={String(n)}>{n} {n === 1 ? 'variation' : 'variations'}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">Number of pin variations to generate per URL</p>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label className="text-sm">Preferred Timezone</Label>
          <Select value={settings.timezone} onValueChange={(v) => setSettings(prev => ({ ...prev, timezone: v }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIMEZONES.map(tz => <SelectItem key={tz} value={tz}>{tz.replace(/_/g, ' ')}</SelectItem>)}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">Times will be displayed in this timezone</p>
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <Button onClick={() => { saveSettings(settings); setSettingsSaved(true); setTimeout(() => setSettingsSaved(false), 3000) }} className="gap-2">
            <FiCheckCircle className="w-4 h-4" /> Save Settings
          </Button>
          {settingsSaved && (
            <span className="text-sm text-green-600 flex items-center gap-1"><FiCheckCircle className="w-4 h-4" />Settings saved!</span>
          )}
        </div>
      </GlassCard>

      {/* Data Management */}
      <GlassCard className="p-6 space-y-4">
        <h3 className="font-semibold text-foreground">Data Management</h3>
        <p className="text-xs text-muted-foreground">Campaign history and stats are stored locally in your browser.</p>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={() => {
            saveCampaigns([])
            saveStats({ totalPosted: 0, totalScheduled: 0, totalDrafts: 0 })
          }} className="gap-2 text-destructive hover:text-destructive">
            <FiTrash2 className="w-4 h-4" /> Clear All Data
          </Button>
        </div>
      </GlassCard>
    </div>
  )

  // ============================================================
  // MAIN RENDER
  // ============================================================
  return (
    <ErrorBoundary>
      <div className="min-h-screen font-sans" style={{ background: 'linear-gradient(135deg, hsl(30, 50%, 97%) 0%, hsl(20, 45%, 95%) 35%, hsl(40, 40%, 96%) 70%, hsl(15, 35%, 97%) 100%)', letterSpacing: '-0.01em', lineHeight: '1.55' }}>
        {/* Mobile Header */}
        <div className="lg:hidden fixed top-0 left-0 right-0 z-30 h-14 bg-background/80 backdrop-blur-md border-b border-border flex items-center justify-between px-4">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <FiMenu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <BsPin className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground">PinBot</span>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="sample-mobile" className="text-xs text-muted-foreground">Sample</Label>
            <Switch id="sample-mobile" checked={sampleMode} onCheckedChange={setSampleMode} />
          </div>
        </div>

        {/* Sidebar */}
        {renderSidebar()}

        {/* Main Content */}
        <main className="lg:ml-64 min-h-screen">
          <div className="pt-16 lg:pt-0">
            {/* Top Bar (Desktop) */}
            <div className="hidden lg:flex items-center justify-end gap-4 p-6 pb-0">
              <div className="flex items-center gap-2">
                <Label htmlFor="sample-desktop" className="text-sm text-muted-foreground">Sample Data</Label>
                <Switch id="sample-desktop" checked={sampleMode} onCheckedChange={setSampleMode} />
              </div>
            </div>

            {/* Screen Content */}
            <div className="p-6">
              <ScrollArea className="h-[calc(100vh-6rem)] lg:h-[calc(100vh-5rem)]">
                <div className="max-w-5xl mx-auto pb-12">
                  {screen === 'dashboard' && renderDashboard()}
                  {screen === 'create' && renderCreatePins()}
                  {screen === 'confirmation' && renderConfirmation()}
                  {screen === 'history' && renderHistory()}
                  {screen === 'settings' && renderSettings()}
                </div>
              </ScrollArea>
            </div>
          </div>
        </main>
      </div>
    </ErrorBoundary>
  )
}
