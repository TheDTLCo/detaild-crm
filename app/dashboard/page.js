"use client"

import { useEffect, useMemo, useState } from "react"
import jsPDF from "jspdf"
import { createClient } from "@/lib/supabase/client"
import LogoutButton from "@/app/components/LogoutButton"

function TabButton({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`min-w-[110px] rounded-2xl px-4 py-3 text-sm font-semibold transition ${
        active
          ? "bg-teal-500 text-white shadow-lg"
          : "bg-white/70 text-gray-800 hover:bg-white dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
      }`}
    >
      {label}
    </button>
  )
}

function StatCard({ label, value, subtext, darkMode, valueClassName = "" }) {
  return (
    <div
      className={`rounded-3xl border p-5 shadow-sm ${
        darkMode
          ? "border-white/10 bg-gray-800/90"
          : "border-black/5 bg-white/90"
      }`}
    >
      <p className="text-sm uppercase tracking-[0.18em] text-gray-500">{label}</p>
      <p className={`mt-3 text-3xl font-bold tracking-tight ${valueClassName}`}>
        {value}
      </p>
      {subtext ? <p className="mt-2 text-xs text-gray-500">{subtext}</p> : null}
    </div>
  )
}

function SectionCard({ title, children, darkMode, rightSlot = null }) {
  return (
    <div
      className={`rounded-3xl border p-5 shadow-sm ${
        darkMode
          ? "border-white/10 bg-gray-800/90"
          : "border-black/5 bg-white/90"
      }`}
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
        {rightSlot}
      </div>
      {children}
    </div>
  )
}

function QuickActionButton({ children, onClick, className = "" }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-2xl px-4 py-3 text-sm font-semibold transition hover:scale-[1.02] ${className}`}
    >
      {children}
    </button>
  )
}

function StatusBadge({ status }) {
  const classes =
    status === "Booked"
      ? "bg-blue-500/90"
      : status === "In Progress"
      ? "bg-yellow-400/90 text-black"
      : "bg-green-500/90"

  return (
    <span
      className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white ${classes}`}
    >
      {status}
    </span>
  )
}

function PaymentBadge({ paymentStatus }) {
  const paid = (paymentStatus || "Unpaid") === "Paid"

  return (
    <span
      className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${
        paid ? "bg-emerald-600/90 text-white" : "bg-red-500/90 text-white"
      }`}
    >
      {paymentStatus || "Unpaid"}
    </span>
  )
}

function CompactJobRow({ job, onOpen, darkMode }) {
  const total =
    job.pricing_breakdown?.reduce(
      (sum, item) => sum + (parseFloat(item.cost) || 0),
      0
    ) || job.price || 0

  return (
    <button
      onClick={() => onOpen(job)}
      className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
        darkMode
          ? "border-white/10 bg-white/5 hover:bg-white/10"
          : "border-black/5 bg-black/[0.03] hover:bg-black/[0.05]"
      }`}
    >
      <div className="min-w-0">
        <p className="truncate font-semibold">{job.customer_name}</p>
        <p className="truncate text-sm text-gray-500">
          {job.vehicle} • {job.job_details?.[0] || "No service detail"}
        </p>
      </div>

      <div className="ml-4 flex shrink-0 items-center gap-2">
        <StatusBadge status={job.status} />
        <span className="text-sm font-bold text-teal-500">
          ${total.toFixed(2)}
        </span>
      </div>
    </button>
  )
}

function JobCard({
  job,
  darkMode,
  onOpen,
  onCall,
  onMaps,
  onShare,
  onMarkDone,
  onMarkPaid,
  onInvoice,
  onDelete,
}) {
  const total =
    job.pricing_breakdown?.reduce(
      (sum, item) => sum + (parseFloat(item.cost) || 0),
      0
    ) || job.price || 0

  const formattedDate = job.job_date
    ? new Date(job.job_date).toLocaleDateString()
    : "Not set"

  const beforePreview = job.before_photos?.[0]
  const afterPreview = job.after_photos?.[0]
  const primaryDetail = job.job_details?.[0] || "No service detail yet"

  return (
    <div
      onClick={() => onOpen(job)}
      className={`group cursor-pointer overflow-hidden rounded-3xl border shadow-md transition duration-300 hover:-translate-y-1 hover:shadow-2xl ${
        darkMode
          ? "border-white/10 bg-gradient-to-b from-gray-800 to-gray-900"
          : "border-black/5 bg-gradient-to-b from-white to-gray-50"
      }`}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate text-xl font-bold tracking-tight">
              {job.customer_name || "Untitled Job"}
            </p>
            <p className="text-sm text-gray-500">
              {job.vehicle || "Vehicle not set"}
            </p>
            <p className="mt-2 text-xs uppercase tracking-[0.25em] text-gray-400">
              {formattedDate}
            </p>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-2">
            <StatusBadge status={job.status} />
            <PaymentBadge paymentStatus={job.payment_status} />
          </div>
        </div>

        <div
          className={`mt-5 rounded-2xl border p-4 ${
            darkMode
              ? "border-white/10 bg-white/5"
              : "border-black/5 bg-black/[0.03]"
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">
            Service
          </p>
          <p className="mt-2 text-base font-semibold">{primaryDetail}</p>

          {job.job_address && (
            <>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">
                Address
              </p>
              <p className="mt-2 truncate text-sm text-gray-500">
                {job.job_address}
              </p>
            </>
          )}

          {job.customer_notes && (
            <>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">
                Notes
              </p>
              <p className="mt-2 line-clamp-2 text-sm text-gray-500">
                {job.customer_notes}
              </p>
            </>
          )}
        </div>

        {(beforePreview || afterPreview) && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div
              className={`rounded-2xl border p-2 ${
                darkMode
                  ? "border-white/10 bg-white/5"
                  : "border-black/5 bg-black/[0.03]"
              }`}
            >
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">
                Before
              </p>
              {beforePreview ? (
                <img
                  src={beforePreview}
                  alt="Before preview"
                  className="h-24 w-full rounded-xl object-cover"
                />
              ) : (
                <div className="flex h-24 items-center justify-center rounded-xl border border-dashed text-xs text-gray-400">
                  None
                </div>
              )}
            </div>

            <div
              className={`rounded-2xl border p-2 ${
                darkMode
                  ? "border-white/10 bg-white/5"
                  : "border-black/5 bg-black/[0.03]"
              }`}
            >
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">
                After
              </p>
              {afterPreview ? (
                <img
                  src={afterPreview}
                  alt="After preview"
                  className="h-24 w-full rounded-xl object-cover"
                />
              ) : (
                <div className="flex h-24 items-center justify-center rounded-xl border border-dashed text-xs text-gray-400">
                  None
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
              Job Total
            </p>
            <p className="mt-1 text-2xl font-bold text-teal-500">
              ${total.toFixed(2)}
            </p>
          </div>

          <div className="text-right text-xs text-gray-400">
            <p>Before: {job.before_photos?.length || 0}</p>
            <p>After: {job.after_photos?.length || 0}</p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2 border-t border-white/10 pt-4">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onCall(job.customer_phone)
            }}
            className="rounded-xl bg-gray-700 px-3 py-2 text-xs font-semibold text-white transition hover:scale-105 hover:bg-gray-600"
          >
            Call
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation()
              onMaps(job.job_address)
            }}
            className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:scale-105 hover:bg-indigo-500"
          >
            Maps
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation()
              onShare(job)
            }}
            className="rounded-xl bg-purple-600 px-3 py-2 text-xs font-semibold text-white transition hover:scale-105 hover:bg-purple-500"
          >
            Share
          </button>

          {job.status !== "Done" && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onMarkDone(job.id)
              }}
              className="rounded-xl bg-green-600 px-3 py-2 text-xs font-semibold text-white transition hover:scale-105 hover:bg-green-500"
            >
              Done
            </button>
          )}

          {(job.payment_status || "Unpaid") !== "Paid" && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onMarkPaid(job.id)
              }}
              className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:scale-105 hover:bg-emerald-500"
            >
              Paid
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation()
              onInvoice(job)
            }}
            className="rounded-xl bg-blue-500 px-3 py-2 text-xs font-semibold text-white transition hover:scale-105 hover:bg-blue-400"
          >
            Invoice
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(job.id)
            }}
            className="rounded-xl bg-red-500 px-3 py-2 text-xs font-semibold text-white transition hover:scale-105 hover:bg-red-600"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

function ScheduleDayCard({ dateLabel, jobs, darkMode, onOpen }) {
  return (
    <div
      className={`rounded-3xl border p-5 shadow-sm ${
        darkMode
          ? "border-white/10 bg-gray-800/90"
          : "border-black/5 bg-white/90"
      }`}
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-gray-500">
            Schedule
          </p>
          <h3 className="mt-1 text-xl font-bold">{dateLabel}</h3>
        </div>
        <div className="rounded-full bg-teal-500/15 px-3 py-1 text-xs font-semibold text-teal-500">
          {jobs.length} job{jobs.length !== 1 ? "s" : ""}
        </div>
      </div>

      <div className="space-y-3">
        {jobs.map((job) => {
          const total =
            job.pricing_breakdown?.reduce(
              (sum, item) => sum + (parseFloat(item.cost) || 0),
              0
            ) || job.price || 0

          return (
            <button
              key={job.id}
              onClick={() => onOpen(job)}
              className={`flex w-full items-center justify-between rounded-2xl border px-4 py-4 text-left transition ${
                darkMode
                  ? "border-white/10 bg-white/5 hover:bg-white/10"
                  : "border-black/5 bg-black/[0.03] hover:bg-black/[0.05]"
              }`}
            >
              <div className="min-w-0">
                <p className="truncate font-semibold">{job.customer_name}</p>
                <p className="truncate text-sm text-gray-500">
                  {job.vehicle} • {job.job_details?.[0] || "No service detail"}
                </p>
                {job.job_address && (
                  <p className="mt-1 truncate text-xs text-gray-400">
                    {job.job_address}
                  </p>
                )}
              </div>

              <div className="ml-4 flex shrink-0 flex-col items-end gap-2">
                <div className="flex gap-2">
                  <StatusBadge status={job.status} />
                  <PaymentBadge paymentStatus={job.payment_status} />
                </div>
                <p className="text-sm font-bold text-teal-500">
                  ${total.toFixed(2)}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function CalendarGrid({ monthDate, jobs, darkMode, onOpen }) {
  const year = monthDate.getFullYear()
  const month = monthDate.getMonth()

  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)

  const startWeekday = firstDayOfMonth.getDay()
  const daysInMonth = lastDayOfMonth.getDate()

  const cells = []
  for (let i = 0; i < startWeekday; i += 1) cells.push(null)
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, month, day))
  }

  const todayString = new Date().toISOString().split("T")[0]

  const jobsByDate = jobs.reduce((acc, job) => {
    const key = String(job.job_date || "").split("T")[0]
    if (!key) return acc
    if (!acc[key]) acc[key] = []
    acc[key].push(job)
    return acc
  }, {})

  const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-7 gap-2">
        {weekdayLabels.map((label) => (
          <div
            key={label}
            className="px-2 py-2 text-center text-xs font-semibold uppercase tracking-[0.2em] text-gray-500"
          >
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {cells.map((dateObj, index) => {
          if (!dateObj) {
            return (
              <div
                key={`empty-${index}`}
                className={`min-h-[120px] rounded-2xl border ${
                  darkMode
                    ? "border-white/5 bg-white/[0.02]"
                    : "border-black/[0.03] bg-black/[0.02]"
                }`}
              />
            )
          }

          const key = dateObj.toISOString().split("T")[0]
          const dayJobs = jobsByDate[key] || []
          const isToday = key === todayString

          return (
            <div
              key={key}
              className={`min-h-[120px] rounded-2xl border p-2 ${
                isToday
                  ? "border-teal-500 bg-teal-500/10"
                  : darkMode
                  ? "border-white/10 bg-white/5"
                  : "border-black/5 bg-black/[0.03]"
              }`}
            >
              <div className="mb-2 flex items-center justify-between">
                <p className={`text-sm font-bold ${isToday ? "text-teal-400" : ""}`}>
                  {dateObj.getDate()}
                </p>
                {dayJobs.length > 0 && (
                  <span className="rounded-full bg-blue-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                    {dayJobs.length}
                  </span>
                )}
              </div>

              <div className="space-y-1">
                {dayJobs.slice(0, 3).map((job) => (
                  <button
                    key={job.id}
                    onClick={() => onOpen(job)}
                    className="w-full rounded-lg bg-white/10 px-2 py-1 text-left text-[11px] font-medium transition hover:bg-white/20"
                  >
                    <span className="block truncate">{job.customer_name}</span>
                    <span className="block truncate text-[10px] text-gray-400">
                      {job.vehicle}
                    </span>
                  </button>
                ))}

                {dayJobs.length > 3 && (
                  <div className="text-[10px] font-semibold text-gray-400">
                    +{dayJobs.length - 3} more
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DilutionCalculator({ darkMode }) {
  const [ratioParts, setRatioParts] = useState("10")
  const [bottleSize, setBottleSize] = useState("500")
  const [unit, setUnit] = useState("ml")

  const parts = parseFloat(ratioParts) || 0
  const total = parseFloat(bottleSize) || 0

  const chemicalAmount = parts > 0 ? total / (parts + 1) : 0
  const waterAmount = total - chemicalAmount

  const commonPresets = [
    { label: "1:4", value: "4" },
    { label: "1:10", value: "10" },
    { label: "1:20", value: "20" },
    { label: "1:50", value: "50" },
  ]

  return (
    <SectionCard title="Dilution Calculator" darkMode={darkMode}>
      <div className="grid gap-6 lg:grid-cols-2">
        <div
          className={`rounded-3xl border p-5 ${
            darkMode
              ? "border-white/10 bg-white/5"
              : "border-black/5 bg-black/[0.03]"
          }`}
        >
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold">Ratio</label>
              <div className="flex items-center gap-3">
                <div className="rounded-xl border border-white/10 bg-black/10 px-4 py-3 text-sm font-semibold">
                  1 :
                </div>
                <input
                  type="number"
                  min="1"
                  value={ratioParts}
                  onChange={(e) => setRatioParts(e.target.value)}
                  className="w-full rounded-xl border bg-gray-50 p-3 text-black dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Total Bottle Size
              </label>
              <div className="flex gap-3">
                <input
                  type="number"
                  min="1"
                  value={bottleSize}
                  onChange={(e) => setBottleSize(e.target.value)}
                  className="w-full rounded-xl border bg-gray-50 p-3 text-black dark:bg-gray-700 dark:text-white"
                />
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="rounded-xl border bg-gray-50 p-3 text-black dark:bg-gray-700 dark:text-white"
                >
                  <option value="ml">ml</option>
                  <option value="L">L</option>
                </select>
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold">Quick Ratios</p>
              <div className="flex flex-wrap gap-2">
                {commonPresets.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => setRatioParts(preset.value)}
                    className="rounded-xl bg-teal-500/15 px-3 py-2 text-sm font-semibold text-teal-400 transition hover:bg-teal-500/25"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div
          className={`rounded-3xl border p-5 ${
            darkMode
              ? "border-white/10 bg-white/5"
              : "border-black/5 bg-black/[0.03]"
          }`}
        >
          <p className="text-sm uppercase tracking-[0.18em] text-gray-500">
            Result
          </p>

          <div className="mt-5 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
              <p className="text-sm text-gray-500">Chemical Needed</p>
              <p className="mt-1 text-3xl font-bold text-teal-500">
                {chemicalAmount.toFixed(2)} {unit}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
              <p className="text-sm text-gray-500">Water Needed</p>
              <p className="mt-1 text-3xl font-bold text-blue-400">
                {waterAmount.toFixed(2)} {unit}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
              <p className="text-sm text-gray-500">Mix Summary</p>
              <p className="mt-1 text-base font-semibold">
                For a 1:{parts || 0} mix in a {total || 0}
                {unit} bottle, use {chemicalAmount.toFixed(2)}
                {unit} of chemical and {waterAmount.toFixed(2)}
                {unit} of water.
              </p>
            </div>
          </div>
        </div>
      </div>
    </SectionCard>
  )
}

function PhotoGallery({
  title,
  photos,
  onUpload,
  onRemove,
  uploading,
  darkMode,
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        darkMode
          ? "border-gray-700 bg-gray-800"
          : "border-gray-200 bg-gray-50"
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        <label className="cursor-pointer rounded-lg bg-teal-500 px-3 py-2 text-xs font-semibold text-white transition hover:scale-105">
          Upload
          <input
            type="file"
            className="hidden"
            onChange={onUpload}
            disabled={uploading}
          />
        </label>
      </div>

      {uploading && <p className="mb-3 text-sm text-gray-500">Uploading...</p>}

      {photos?.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {photos.map((photo, index) => (
            <div key={`${title}-${index}`} className="relative">
              <img
                src={photo}
                alt={title}
                className="h-24 w-24 rounded-lg border object-cover sm:h-28 sm:w-28"
              />
              <button
                onClick={() => onRemove(index)}
                className="absolute -right-2 -top-2 rounded-full bg-red-500 px-2 py-1 text-xs text-white"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">No photos yet.</p>
      )}
    </div>
  )
}

function JobModal({
  job,
  jobs,
  onClose,
  onUpdate,
  darkMode,
  generateInvoice,
  supabase,
}) {
  if (!job) return null

  const [customer, setCustomer] = useState(job.customer_name || "")
  const [phone, setPhone] = useState(job.customer_phone || "")
  const [vehicle, setVehicle] = useState(job.vehicle || "")
  const [address, setAddress] = useState(job.job_address || "")
  const [customerNotes, setCustomerNotes] = useState(job.customer_notes || "")
  const [date, setDate] = useState(
    job.job_date
      ? String(job.job_date).split("T")[0]
      : new Date().toISOString().split("T")[0]
  )
  const [details, setDetails] = useState(job.job_details || [])
  const [pricing, setPricing] = useState(job.pricing_breakdown || [])
  const [status, setStatus] = useState(job.status || "Booked")
  const [paymentStatus, setPaymentStatus] = useState(
    job.payment_status || "Unpaid"
  )
  const [beforePhotos, setBeforePhotos] = useState(job.before_photos || [])
  const [afterPhotos, setAfterPhotos] = useState(job.after_photos || [])
  const [uploadingBefore, setUploadingBefore] = useState(false)
  const [uploadingAfter, setUploadingAfter] = useState(false)

  const total = pricing.reduce(
    (sum, item) => sum + (parseFloat(item.cost) || 0),
    0
  )

  const customerHistory = useMemo(() => {
    return jobs
      .filter(
        (j) =>
          j.id !== job.id &&
          (j.customer_name || "").trim().toLowerCase() ===
            customer.trim().toLowerCase()
      )
      .sort((a, b) => new Date(b.job_date || 0) - new Date(a.job_date || 0))
  }, [jobs, job.id, customer])

  const handleSave = async () => {
    await onUpdate(job.id, {
      customer_name: customer,
      customer_phone: phone,
      vehicle,
      job_address: address,
      customer_notes: customerNotes,
      job_date: date,
      job_details: details,
      pricing_breakdown: pricing,
      status,
      payment_status: paymentStatus,
      before_photos: beforePhotos,
      after_photos: afterPhotos,
      price: total,
    })
    onClose()
  }

  const uploadPhotoToBucket = async (file, prefix = "job") => {
    const fileExt = file.name.split(".").pop()
    const fileName = `${prefix}_${job.id}_${Date.now()}.${fileExt}`

    const { error } = await supabase.storage
      .from("job-photos")
      .upload(fileName, file)

    if (error) throw error

    const { data } = supabase.storage.from("job-photos").getPublicUrl(fileName)
    return data.publicUrl
  }

  const handleBeforeUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingBefore(true)
    try {
      const publicUrl = await uploadPhotoToBucket(file, "before")
      const updated = [...beforePhotos, publicUrl]
      setBeforePhotos(updated)
      await onUpdate(job.id, { before_photos: updated })
    } catch (error) {
      alert(error.message)
    } finally {
      setUploadingBefore(false)
    }
  }

  const handleAfterUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingAfter(true)
    try {
      const publicUrl = await uploadPhotoToBucket(file, "after")
      const updated = [...afterPhotos, publicUrl]
      setAfterPhotos(updated)
      await onUpdate(job.id, { after_photos: updated })
    } catch (error) {
      alert(error.message)
    } finally {
      setUploadingAfter(false)
    }
  }

  const removeBeforePhoto = async (indexToRemove) => {
    const updated = beforePhotos.filter((_, index) => index !== indexToRemove)
    setBeforePhotos(updated)
    await onUpdate(job.id, { before_photos: updated })
  }

  const removeAfterPhoto = async (indexToRemove) => {
    const updated = afterPhotos.filter((_, index) => index !== indexToRemove)
    setAfterPhotos(updated)
    await onUpdate(job.id, { after_photos: updated })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div
        className={`flex h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl border shadow-2xl sm:h-auto sm:max-h-[90vh] sm:max-w-6xl sm:rounded-3xl ${
          darkMode
            ? "border-gray-700 bg-gray-900 text-white"
            : "border-gray-200 bg-white text-gray-900"
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-200/10 px-4 py-4 sm:px-6">
          <h2 className="text-xl font-bold sm:text-2xl">Edit Job</h2>
          <button
            onClick={onClose}
            className="rounded-lg bg-gray-300 px-3 py-2 text-sm transition hover:scale-105 dark:bg-gray-700 dark:text-white"
          >
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          <div className="grid gap-6 xl:grid-cols-3">
            <div className="space-y-6 xl:col-span-2">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-sm font-semibold">
                    Customer Name
                  </span>
                  <input
                    value={customer}
                    onChange={(e) => setCustomer(e.target.value)}
                    className="w-full rounded-lg border bg-gray-50 p-3 text-black dark:bg-gray-700 dark:text-white"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm font-semibold">
                    Customer Phone
                  </span>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-lg border bg-gray-50 p-3 text-black dark:bg-gray-700 dark:text-white"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm font-semibold">
                    Vehicle
                  </span>
                  <input
                    value={vehicle}
                    onChange={(e) => setVehicle(e.target.value)}
                    className="w-full rounded-lg border bg-gray-50 p-3 text-black dark:bg-gray-700 dark:text-white"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm font-semibold">
                    Job Date
                  </span>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-lg border bg-gray-50 p-3 text-black dark:bg-gray-700 dark:text-white"
                  />
                </label>

                <label className="block md:col-span-2">
                  <span className="mb-1 block text-sm font-semibold">
                    Job Address
                  </span>
                  <input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full rounded-lg border bg-gray-50 p-3 text-black dark:bg-gray-700 dark:text-white"
                  />
                </label>

                <label className="block md:col-span-2">
                  <span className="mb-1 block text-sm font-semibold">
                    Customer Notes
                  </span>
                  <textarea
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    rows={4}
                    placeholder="Paint condition, preferences, access notes, previous coatings..."
                    className="w-full rounded-lg border bg-gray-50 p-3 text-black dark:bg-gray-700 dark:text-white"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm font-semibold">
                    Job Status
                  </span>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full rounded-lg border bg-gray-50 p-3 text-black dark:bg-gray-700 dark:text-white"
                  >
                    <option>Booked</option>
                    <option>In Progress</option>
                    <option>Done</option>
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm font-semibold">
                    Payment Status
                  </span>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value)}
                    className="w-full rounded-lg border bg-gray-50 p-3 text-black dark:bg-gray-700 dark:text-white"
                  >
                    <option>Unpaid</option>
                    <option>Paid</option>
                  </select>
                </label>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Job Details</h3>
                  <button
                    onClick={() => setDetails([...(details || []), ""])}
                    className="text-sm text-teal-500 hover:underline"
                  >
                    + Add Detail
                  </button>
                </div>

                {(details || []).map((detail, index) => (
                  <div key={`detail-${index}`} className="flex gap-2">
                    <input
                      value={detail}
                      onChange={(e) => {
                        const updated = [...details]
                        updated[index] = e.target.value
                        setDetails(updated)
                      }}
                      className="w-full rounded-lg border bg-gray-50 p-3 text-black dark:bg-gray-700 dark:text-white"
                    />
                    <button
                      onClick={() =>
                        setDetails(details.filter((_, i) => i !== index))
                      }
                      className="rounded-lg bg-red-500 px-4 py-3 text-white"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Pricing</h3>
                  <button
                    onClick={() =>
                      setPricing([...(pricing || []), { service: "", cost: "" }])
                    }
                    className="text-sm text-teal-500 hover:underline"
                  >
                    + Add Line
                  </button>
                </div>

                {(pricing || []).map((item, index) => (
                  <div
                    key={`price-${index}`}
                    className="flex flex-col gap-2 sm:flex-row"
                  >
                    <input
                      placeholder="Service"
                      value={item.service}
                      onChange={(e) => {
                        const updated = [...pricing]
                        updated[index].service = e.target.value
                        setPricing(updated)
                      }}
                      className="flex-1 rounded-lg border bg-gray-50 p-3 text-black dark:bg-gray-700 dark:text-white"
                    />
                    <div className="flex gap-2">
                      <input
                        placeholder="Cost"
                        type="number"
                        value={item.cost}
                        onChange={(e) => {
                          const updated = [...pricing]
                          updated[index].cost = e.target.value
                          setPricing(updated)
                        }}
                        className="w-full rounded-lg border bg-gray-50 p-3 text-black dark:bg-gray-700 dark:text-white sm:w-28"
                      />
                      <button
                        onClick={() =>
                          setPricing(pricing.filter((_, i) => i !== index))
                        }
                        className="rounded-lg bg-red-500 px-4 py-3 text-white"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <PhotoGallery
                  title="Before Photos"
                  photos={beforePhotos}
                  onUpload={handleBeforeUpload}
                  onRemove={removeBeforePhoto}
                  uploading={uploadingBefore}
                  darkMode={darkMode}
                />
                <PhotoGallery
                  title="After Photos"
                  photos={afterPhotos}
                  onUpload={handleAfterUpload}
                  onRemove={removeAfterPhoto}
                  uploading={uploadingAfter}
                  darkMode={darkMode}
                />
              </div>
            </div>

            <div className="space-y-6">
              <div
                className={`rounded-2xl border p-4 ${
                  darkMode
                    ? "border-gray-700 bg-gray-800"
                    : "border-gray-200 bg-gray-50"
                }`}
              >
                <h3 className="mb-3 text-sm font-semibold">Customer Notes</h3>
                {customerNotes ? (
                  <p className="whitespace-pre-wrap text-sm text-gray-600 dark:text-gray-300">
                    {customerNotes}
                  </p>
                ) : (
                  <p className="text-sm text-gray-500">
                    No customer notes added yet.
                  </p>
                )}
              </div>

              <div
                className={`rounded-2xl border p-4 ${
                  darkMode
                    ? "border-gray-700 bg-gray-800"
                    : "border-gray-200 bg-gray-50"
                }`}
              >
                <h3 className="mb-3 text-sm font-semibold">Customer History</h3>

                {customerHistory.length > 0 ? (
                  <div className="space-y-3">
                    {customerHistory.map((historyJob) => {
                      const historyTotal =
                        historyJob.pricing_breakdown?.reduce(
                          (sum, item) => sum + (parseFloat(item.cost) || 0),
                          0
                        ) || historyJob.price || 0

                      return (
                        <div
                          key={historyJob.id}
                          className={`rounded-xl border p-3 ${
                            darkMode
                              ? "border-gray-700 bg-gray-900"
                              : "border-gray-200 bg-white"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <p className="font-semibold">
                                {historyJob.vehicle}
                              </p>
                              <p className="text-xs text-gray-500">
                                {historyJob.job_date
                                  ? new Date(
                                      historyJob.job_date
                                    ).toLocaleDateString()
                                  : "No date"}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <StatusBadge status={historyJob.status} />
                              <PaymentBadge
                                paymentStatus={historyJob.payment_status}
                              />
                            </div>
                          </div>

                          <p className="mt-2 text-sm font-semibold text-teal-500">
                            ${historyTotal.toFixed(2)}
                          </p>

                          {historyJob.customer_notes && (
                            <p className="mt-2 line-clamp-2 text-xs text-gray-400">
                              Notes: {historyJob.customer_notes}
                            </p>
                          )}

                          <div className="mt-2 flex gap-2 text-xs text-gray-500">
                            <span>
                              Before: {historyJob.before_photos?.length || 0}
                            </span>
                            <span>
                              After: {historyJob.after_photos?.length || 0}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    No previous jobs found for this customer.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div
          className={`sticky bottom-0 border-t px-4 py-4 sm:px-6 ${
            darkMode
              ? "border-gray-700 bg-gray-900"
              : "border-gray-200 bg-white"
          }`}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-lg font-bold">
              Total: <span className="text-teal-500">${total.toFixed(2)}</span>
            </p>

            <div className="grid grid-cols-2 gap-2 sm:flex">
              <button
                onClick={() =>
                  generateInvoice({
                    ...job,
                    customer_name: customer,
                    customer_phone: phone,
                    vehicle,
                    job_address: address,
                    customer_notes: customerNotes,
                    job_date: date,
                    job_details: details,
                    pricing_breakdown: pricing,
                    status,
                    payment_status: paymentStatus,
                    before_photos: beforePhotos,
                    after_photos: afterPhotos,
                    price: total,
                  })
                }
                className="rounded-lg bg-blue-500 px-4 py-3 text-white transition hover:scale-105"
              >
                Invoice
              </button>
              <button
                onClick={handleSave}
                className="rounded-lg bg-teal-500 px-4 py-3 text-white transition hover:scale-105"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const supabase = createClient()

  const [jobs, setJobs] = useState([])
  const [expenses, setExpenses] = useState([])
  const [selectedJob, setSelectedJob] = useState(null)
  const [darkMode, setDarkMode] = useState(true)
  const [filterStatus, setFilterStatus] = useState("All")
  const [filterDate, setFilterDate] = useState("")
  const [financePeriod, setFinancePeriod] = useState("All Time")
  const [activeTab, setActiveTab] = useState("Dashboard")
  const [calendarDate, setCalendarDate] = useState(new Date())

  const [expenseAmount, setExpenseAmount] = useState("")
  const [expenseCategory, setExpenseCategory] = useState("Products")
  const [expenseNote, setExpenseNote] = useState("")
  const [expenseDate, setExpenseDate] = useState(
    new Date().toISOString().split("T")[0]
  )

  useEffect(() => {
    fetchJobs()
    fetchExpenses()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchJobs = async () => {
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .order("job_date", { ascending: true })

    if (error) {
      console.error("Fetch jobs error:", error)
      return
    }

    setJobs(data || [])
  }

  const fetchExpenses = async () => {
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .order("date", { ascending: false })

    if (error) {
      console.error("Fetch expenses error:", error)
      return
    }

    setExpenses(data || [])
  }

  const addJob = async () => {
    const todayStr = new Date().toISOString().split("T")[0]

    const { error } = await supabase.from("jobs").insert([
      {
        customer_name: "New Customer",
        customer_phone: "",
        vehicle: "Vehicle",
        job_address: "",
        customer_notes: "",
        job_date: todayStr,
        price: 0,
        job_details: [],
        pricing_breakdown: [],
        before_photos: [],
        after_photos: [],
        status: "Booked",
        payment_status: "Unpaid",
      },
    ])

    if (error) {
      alert("Failed to add job: " + error.message)
      return
    }

    fetchJobs()
  }

  const updateJob = async (id, updates) => {
    const { error } = await supabase.from("jobs").update(updates).eq("id", id)

    if (error) {
      alert("Failed to update job: " + error.message)
      return
    }

    fetchJobs()
  }

  const deleteJob = async (id) => {
    if (!confirm("Delete this job?")) return

    const { error } = await supabase.from("jobs").delete().eq("id", id)

    if (error) {
      alert("Failed to delete job: " + error.message)
      return
    }

    fetchJobs()
  }

  const markJobDone = async (id) => {
    const { error } = await supabase
      .from("jobs")
      .update({ status: "Done" })
      .eq("id", id)

    if (error) {
      alert("Failed to mark job done: " + error.message)
      return
    }

    fetchJobs()
  }

  const markJobPaid = async (id) => {
    const { error } = await supabase
      .from("jobs")
      .update({ payment_status: "Paid" })
      .eq("id", id)

    if (error) {
      alert("Failed to mark job paid: " + error.message)
      return
    }

    fetchJobs()
  }

  const openCall = (phone) => {
    if (!phone) {
      alert("No customer phone number saved for this job.")
      return
    }
    window.location.href = `tel:${phone}`
  }

  const openMaps = (address) => {
    if (!address) {
      alert("No job address saved for this job.")
      return
    }
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        address
      )}`,
      "_blank"
    )
  }

  const generateShareImage = async (job) => {
    const before = job.before_photos?.[0]
    const after = job.after_photos?.[0]

    if (!before || !after) {
      alert("Need at least 1 before and 1 after photo")
      return
    }

    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")

    const width = 1200
    const height = 1200
    canvas.width = width
    canvas.height = height

    const loadImage = (src) =>
      new Promise((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.src = src
        img.onload = () => resolve(img)
        img.onerror = reject
      })

    try {
      const beforeImg = await loadImage(before)
      const afterImg = await loadImage(after)

      ctx.fillStyle = "#0a0a0a"
      ctx.fillRect(0, 0, width, height)

      ctx.drawImage(beforeImg, 0, 150, width / 2, 700)
      ctx.drawImage(afterImg, width / 2, 150, width / 2, 700)

      ctx.fillStyle = "#ffffff"
      ctx.fillRect(width / 2 - 2, 150, 4, 700)

      ctx.fillStyle = "#ffffff"
      ctx.font = "bold 40px Arial"
      ctx.fillText("BEFORE", width / 4 - 80, 120)
      ctx.fillText("AFTER", (width * 3) / 4 - 60, 120)

      ctx.font = "bold 48px Arial"
      ctx.fillText("THE DTL CO.", 40, height - 90)

      ctx.font = "24px Arial"
      ctx.fillStyle = "#bbbbbb"
      ctx.fillText(job.vehicle || "Auto Detailing", 40, height - 50)

      const link = document.createElement("a")
      link.download = `DTL-${job.customer_name || "detail"}.png`
      link.href = canvas.toDataURL("image/png")
      link.click()
    } catch (error) {
      console.error(error)
      alert("Error generating share image")
    }
  }

  const addExpense = async (e) => {
    e.preventDefault()

    if (!expenseAmount) {
      alert("Enter an expense amount.")
      return
    }

    const payload = {
      amount: parseFloat(expenseAmount) || 0,
      category: expenseCategory || "General",
      note: expenseNote || "",
      date: expenseDate || new Date().toISOString().split("T")[0],
    }

    const { error } = await supabase.from("expenses").insert([payload])

    if (error) {
      alert("Failed to add expense: " + error.message)
      return
    }

    setExpenseAmount("")
    setExpenseCategory("Products")
    setExpenseNote("")
    setExpenseDate(new Date().toISOString().split("T")[0])

    fetchExpenses()
  }

  const deleteExpense = async (id) => {
    if (!confirm("Delete this expense?")) return

    const { error } = await supabase.from("expenses").delete().eq("id", id)

    if (error) {
      alert("Failed to delete expense: " + error.message)
      return
    }

    fetchExpenses()
  }

  const generateInvoice = async (job) => {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()

    const total =
      job.pricing_breakdown?.reduce(
        (sum, item) => sum + (parseFloat(item.cost) || 0),
        0
      ) || job.price || 0

    const gst = total * 0.1
    const subtotal = total - gst
    const invoiceNumber = `DTL-${job.id?.toString().slice(0, 6) || "000001"}`

    doc.setFillColor(10, 10, 10)
    doc.rect(0, 0, pageWidth, 38, "F")

    try {
      const img = new Image()
      img.src = "/logo.png"
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
      })
      doc.addImage(img, "PNG", 14, 8, 58, 20)
    } catch {
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(18)
      doc.text("THE DTL CO.", 14, 20)
    }

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(18)
    doc.text("INVOICE", pageWidth - 45, 16)

    doc.setFontSize(9)
    doc.text(`Invoice No: ${invoiceNumber}`, pageWidth - 60, 24)
    doc.text(
      `Date: ${
        job.job_date ? new Date(job.job_date).toLocaleDateString() : "N/A"
      }`,
      pageWidth - 60,
      30
    )

    doc.setTextColor(30, 30, 30)
    doc.setFontSize(10)
    doc.text("THE DTL CO.", 14, 50)
    doc.text("Auto Detailing", 14, 56)
    doc.text("ABN: 00 000 000 000", 14, 62)
    doc.text("Email: info@thedtlco.com", 14, 68)

    doc.setDrawColor(220, 220, 220)
    doc.roundedRect(120, 46, 75, 40, 2, 2)
    doc.setFontSize(10)
    doc.text("Bill To", 125, 54)
    doc.setFontSize(11)
    doc.text(job.customer_name || "N/A", 125, 62)
    doc.setFontSize(10)
    doc.text(`Vehicle: ${job.vehicle || "N/A"}`, 125, 70)
    if (job.customer_phone) {
      doc.text(`Phone: ${job.customer_phone}`, 125, 78)
    }
    doc.text(`Payment: ${job.payment_status || "Unpaid"}`, 125, 86)

    let y = 100
    doc.setFillColor(240, 240, 240)
    doc.rect(14, y, 182, 10, "F")
    doc.setFontSize(10)
    doc.setTextColor(20, 20, 20)
    doc.text("Description", 18, y + 7)
    doc.text("Amount", 170, y + 7)

    y += 14

    if (job.pricing_breakdown?.length) {
      job.pricing_breakdown.forEach((item, index) => {
        if (index % 2 === 0) {
          doc.setFillColor(250, 250, 250)
          doc.rect(14, y - 5, 182, 10, "F")
        }
        doc.text(item.service || "Service", 18, y)
        doc.text(`$${parseFloat(item.cost || 0).toFixed(2)}`, 170, y)
        y += 10
      })
    } else {
      doc.text("No pricing breakdown available", 18, y)
      y += 10
    }

    if (job.job_details?.length) {
      y += 6
      doc.setFontSize(10)
      doc.text("Job Notes", 14, y)
      y += 6

      job.job_details.slice(0, 5).forEach((detail) => {
        doc.setFontSize(9)
        doc.text(`• ${detail}`, 18, y)
        y += 5
      })
    }

    y += 10
    doc.roundedRect(120, y, 76, 28, 2, 2)
    doc.setFontSize(10)
    doc.text("Subtotal", 126, y + 8)
    doc.text(`$${subtotal.toFixed(2)}`, 170, y + 8)

    doc.text("GST (10%)", 126, y + 16)
    doc.text(`$${gst.toFixed(2)}`, 170, y + 16)

    doc.setFontSize(11)
    doc.setFont(undefined, "bold")
    doc.text("Total", 126, y + 24)
    doc.text(`$${total.toFixed(2)}`, 170, y + 24)
    doc.setFont(undefined, "normal")

    doc.setFontSize(9)
    doc.setTextColor(100, 100, 100)
    doc.text("Thank you for choosing THE DTL CO.", 14, 285)
    doc.text("Premium correction, protection, and detailing.", 14, 290)

    doc.save(`invoice-${job.customer_name || "job"}.pdf`)
  }

  const normalizedToday = new Date().toISOString().split("T")[0]

  const normalizedTomorrow = (() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return d.toISOString().split("T")[0]
  })()

  const todaysJobs = useMemo(() => {
    return jobs.filter(
      (job) => String(job.job_date || "").split("T")[0] === normalizedToday
    )
  }, [jobs, normalizedToday])

  const tomorrowJobs = useMemo(() => {
    return jobs.filter(
      (job) => String(job.job_date || "").split("T")[0] === normalizedTomorrow
    )
  }, [jobs, normalizedTomorrow])

  const upcomingJobs = useMemo(() => {
    return jobs
      .filter((job) => {
        const date = String(job.job_date || "").split("T")[0]
        return date > normalizedTomorrow
      })
      .sort((a, b) => new Date(a.job_date || 0) - new Date(b.job_date || 0))
  }, [jobs, normalizedTomorrow])

  const filteredJobs = useMemo(() => {
    return jobs
      .filter(
        (job) =>
          !filterDate || String(job.job_date || "").split("T")[0] === filterDate
      )
      .filter((job) => filterStatus === "All" || job.status === filterStatus)
      .sort((a, b) => new Date(a.job_date || 0) - new Date(b.job_date || 0))
  }, [jobs, filterDate, filterStatus])

  const filteredFinanceJobs = useMemo(() => {
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    startOfWeek.setHours(0, 0, 0, 0)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    return jobs.filter((job) => {
      if (!job.job_date) return financePeriod === "All Time"
      const jobDate = new Date(job.job_date)
      if (financePeriod === "This Week") return jobDate >= startOfWeek
      if (financePeriod === "This Month") return jobDate >= startOfMonth
      return true
    })
  }, [jobs, financePeriod])

  const filteredFinanceExpenses = useMemo(() => {
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    startOfWeek.setHours(0, 0, 0, 0)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    return expenses.filter((expense) => {
      if (!expense.date) return financePeriod === "All Time"
      const expenseDateValue = new Date(expense.date)
      if (financePeriod === "This Week") return expenseDateValue >= startOfWeek
      if (financePeriod === "This Month")
        return expenseDateValue >= startOfMonth
      return true
    })
  }, [expenses, financePeriod])

  const totalRevenue = useMemo(() => {
    return filteredFinanceJobs.reduce((sum, job) => {
      const jobTotal =
        job.pricing_breakdown?.reduce(
          (s, item) => s + (parseFloat(item.cost) || 0),
          0
        ) || job.price || 0
      return sum + jobTotal
    }, 0)
  }, [filteredFinanceJobs])

  const paidRevenue = useMemo(() => {
    return filteredFinanceJobs.reduce((sum, job) => {
      const jobTotal =
        job.pricing_breakdown?.reduce(
          (s, item) => s + (parseFloat(item.cost) || 0),
          0
        ) || job.price || 0
      return (job.payment_status || "Unpaid") === "Paid" ? sum + jobTotal : sum
    }, 0)
  }, [filteredFinanceJobs])

  const unpaidRevenue = useMemo(() => {
    return filteredFinanceJobs.reduce((sum, job) => {
      const jobTotal =
        job.pricing_breakdown?.reduce(
          (s, item) => s + (parseFloat(item.cost) || 0),
          0
        ) || job.price || 0
      return (job.payment_status || "Unpaid") !== "Paid" ? sum + jobTotal : sum
    }, 0)
  }, [filteredFinanceJobs])

  const totalExpenses = useMemo(() => {
    return filteredFinanceExpenses.reduce(
      (sum, expense) => sum + (parseFloat(expense.amount) || 0),
      0
    )
  }, [filteredFinanceExpenses])

  const paidJobsCount = useMemo(() => {
    return filteredFinanceJobs.filter(
      (job) => (job.payment_status || "Unpaid") === "Paid"
    ).length
  }, [filteredFinanceJobs])

  const unpaidJobsCount = useMemo(() => {
    return filteredFinanceJobs.filter(
      (job) => (job.payment_status || "Unpaid") !== "Paid"
    ).length
  }, [filteredFinanceJobs])

  const completedThisWeekCount = useMemo(() => {
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    startOfWeek.setHours(0, 0, 0, 0)

    return jobs.filter((job) => {
      if (job.status !== "Done" || !job.job_date) return false
      return new Date(job.job_date) >= startOfWeek
    }).length
  }, [jobs])

  const thisWeekRevenue = useMemo(() => {
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    startOfWeek.setHours(0, 0, 0, 0)

    return jobs.reduce((sum, job) => {
      if (!job.job_date || new Date(job.job_date) < startOfWeek) return sum
      const jobTotal =
        job.pricing_breakdown?.reduce(
          (s, item) => s + (parseFloat(item.cost) || 0),
          0
        ) || job.price || 0
      return sum + jobTotal
    }, 0)
  }, [jobs])

  const netProfit = totalRevenue - totalExpenses
  const totalRevenueWithGst = totalRevenue * 1.1
  const outstandingAmount = unpaidRevenue

  const customerSummaries = useMemo(() => {
    const grouped = {}

    jobs.forEach((job) => {
      const total =
        job.pricing_breakdown?.reduce(
          (sum, item) => sum + (parseFloat(item.cost) || 0),
          0
        ) || job.price || 0

      const name = (job.customer_name || "Unknown Customer").trim()

      if (!grouped[name]) {
        grouped[name] = {
          name,
          jobs: 0,
          totalSpend: 0,
          lastVehicle: job.vehicle || "",
          lastDate: job.job_date || "",
        }
      }

      grouped[name].jobs += 1
      grouped[name].totalSpend += total

      if (
        !grouped[name].lastDate ||
        new Date(job.job_date || 0) > new Date(grouped[name].lastDate || 0)
      ) {
        grouped[name].lastDate = job.job_date || ""
        grouped[name].lastVehicle = job.vehicle || ""
      }
    })

    return Object.values(grouped).sort((a, b) => b.totalSpend - a.totalSpend)
  }, [jobs])

  const groupedSchedule = useMemo(() => {
    const sorted = [...jobs].sort(
      (a, b) => new Date(a.job_date || 0) - new Date(b.job_date || 0)
    )

    const groups = {}

    sorted.forEach((job) => {
      const dateKey = String(job.job_date || "").split("T")[0] || "No date"
      if (!groups[dateKey]) groups[dateKey] = []
      groups[dateKey].push(job)
    })

    return Object.entries(groups)
      .filter(([date]) => date !== "No date")
      .map(([date, jobsForDate]) => {
        let label = new Date(date).toLocaleDateString(undefined, {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })

        if (date === normalizedToday) label = `Today • ${label}`
        if (date === normalizedTomorrow) label = `Tomorrow • ${label}`

        return { date, label, jobs: jobsForDate }
      })
  }, [jobs, normalizedToday, normalizedTomorrow])

  const calendarTitle = calendarDate.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  })

  const goPrevMonth = () => {
    setCalendarDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
    )
  }

  const goNextMonth = () => {
    setCalendarDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
    )
  }

  return (
    <div
      className={`min-h-screen pb-24 transition-colors sm:pb-6 ${
        darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"
      }`}
    >
      <div className="sticky top-0 z-40 border-b border-white/10 bg-black/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="The DTL Co."
              className="h-6 w-auto object-contain scale-40 shrink-0"
            />
            <div className="leading-tight">
              <p className="text-sm font-semibold tracking-wide text-white">
                THE DTL CO.
              </p>
              <p className="text-[10px] tracking-[0.3em] text-gray-400">
                DETAILING CRM
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white transition hover:bg-white/10"
            >
              {darkMode ? "Light" : "Dark"}
            </button>

            <button
              onClick={addJob}
              className="rounded-lg bg-teal-500 px-4 py-1.5 text-xs font-semibold text-white transition hover:scale-[1.02] hover:bg-teal-600"
            >
              + Job
            </button>

            <LogoutButton />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
        <div className="overflow-x-auto pb-1">
          <div className="flex w-max gap-2">
            <TabButton
              label="Dashboard"
              active={activeTab === "Dashboard"}
              onClick={() => setActiveTab("Dashboard")}
            />
            <TabButton
              label="Jobs"
              active={activeTab === "Jobs"}
              onClick={() => setActiveTab("Jobs")}
            />
            <TabButton
              label="Schedule"
              active={activeTab === "Schedule"}
              onClick={() => setActiveTab("Schedule")}
            />
            <TabButton
              label="Calendar"
              active={activeTab === "Calendar"}
              onClick={() => setActiveTab("Calendar")}
            />
            <TabButton
              label="Customers"
              active={activeTab === "Customers"}
              onClick={() => setActiveTab("Customers")}
            />
            <TabButton
              label="Finance"
              active={activeTab === "Finance"}
              onClick={() => setActiveTab("Finance")}
            />
            <TabButton
              label="Dilution"
              active={activeTab === "Dilution"}
              onClick={() => setActiveTab("Dilution")}
            />
          </div>
        </div>

        {activeTab === "Dashboard" && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Today’s Jobs"
                value={todaysJobs.length}
                subtext="Scheduled for today"
                darkMode={darkMode}
              />
              <StatCard
                label="Tomorrow"
                value={tomorrowJobs.length}
                subtext="Jobs lined up next"
                darkMode={darkMode}
              />
              <StatCard
                label="This Week Revenue"
                value={`$${thisWeekRevenue.toFixed(2)}`}
                subtext="Current week total"
                darkMode={darkMode}
                valueClassName="text-green-500"
              />
              <StatCard
                label="Completed This Week"
                value={completedThisWeekCount}
                subtext="Jobs marked done"
                darkMode={darkMode}
                valueClassName="text-teal-500"
              />
            </div>

            <SectionCard title="Quick Actions" darkMode={darkMode}>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <QuickActionButton
                  onClick={addJob}
                  className="bg-teal-500 text-white shadow hover:bg-teal-600"
                >
                  + Add Job
                </QuickActionButton>

                <QuickActionButton
                  onClick={() => setActiveTab("Jobs")}
                  className="bg-blue-500 text-white shadow hover:bg-blue-600"
                >
                  View All Jobs
                </QuickActionButton>

                <QuickActionButton
                  onClick={() => setActiveTab("Calendar")}
                  className="bg-indigo-600 text-white shadow hover:bg-indigo-700"
                >
                  Open Calendar
                </QuickActionButton>

                <QuickActionButton
                  onClick={() => setActiveTab("Dilution")}
                  className="bg-purple-600 text-white shadow hover:bg-purple-700"
                >
                  Dilution Tool
                </QuickActionButton>
              </div>
            </SectionCard>

            <div className="grid gap-6 xl:grid-cols-3">
              <SectionCard title="Today" darkMode={darkMode}>
                {todaysJobs.length > 0 ? (
                  <div className="space-y-3">
                    {todaysJobs.map((job) => (
                      <CompactJobRow
                        key={job.id}
                        job={job}
                        onOpen={setSelectedJob}
                        darkMode={darkMode}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No jobs booked today.</p>
                )}
              </SectionCard>

              <SectionCard title="Tomorrow" darkMode={darkMode}>
                {tomorrowJobs.length > 0 ? (
                  <div className="space-y-3">
                    {tomorrowJobs.map((job) => (
                      <CompactJobRow
                        key={job.id}
                        job={job}
                        onOpen={setSelectedJob}
                        darkMode={darkMode}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    No jobs locked in for tomorrow.
                  </p>
                )}
              </SectionCard>

              <SectionCard title="Upcoming" darkMode={darkMode}>
                {upcomingJobs.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingJobs.slice(0, 5).map((job) => (
                      <CompactJobRow
                        key={job.id}
                        job={job}
                        onOpen={setSelectedJob}
                        darkMode={darkMode}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No future jobs yet.</p>
                )}
              </SectionCard>
            </div>

            <div className="grid gap-6 xl:grid-cols-3">
              <div className="xl:col-span-2">
                <SectionCard
                  title="Next Jobs In Queue"
                  darkMode={darkMode}
                  rightSlot={
                    <button
                      onClick={() => setActiveTab("Jobs")}
                      className="text-sm text-teal-500 hover:underline"
                    >
                      View all
                    </button>
                  }
                >
                  {filteredJobs.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      {filteredJobs.slice(0, 4).map((job) => (
                        <JobCard
                          key={job.id}
                          job={job}
                          darkMode={darkMode}
                          onOpen={setSelectedJob}
                          onCall={openCall}
                          onMaps={openMaps}
                          onShare={generateShareImage}
                          onMarkDone={markJobDone}
                          onMarkPaid={markJobPaid}
                          onInvoice={generateInvoice}
                          onDelete={deleteJob}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No jobs to show.</p>
                  )}
                </SectionCard>
              </div>

              <div className="xl:col-span-1">
                <SectionCard title="Snapshot" darkMode={darkMode}>
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                      <p className="text-sm text-gray-500">Paid Revenue</p>
                      <p className="mt-1 text-2xl font-bold text-emerald-500">
                        ${paidRevenue.toFixed(2)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                      <p className="text-sm text-gray-500">Outstanding</p>
                      <p className="mt-1 text-2xl font-bold text-orange-500">
                        ${outstandingAmount.toFixed(2)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                      <p className="text-sm text-gray-500">Expenses</p>
                      <p className="mt-1 text-2xl font-bold text-red-500">
                        ${totalExpenses.toFixed(2)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                      <p className="text-sm text-gray-500">Net Profit</p>
                      <p className="mt-1 text-2xl font-bold text-teal-500">
                        ${netProfit.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </SectionCard>
              </div>
            </div>
          </>
        )}

        {activeTab === "Jobs" && (
          <SectionCard
            title="Jobs"
            darkMode={darkMode}
            rightSlot={
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="rounded border bg-gray-50 p-3 text-black dark:bg-gray-700 dark:text-white"
                >
                  <option>All</option>
                  <option>Booked</option>
                  <option>In Progress</option>
                  <option>Done</option>
                </select>

                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="rounded border bg-gray-50 p-3 text-black dark:bg-gray-700 dark:text-white"
                />

                <button
                  onClick={addJob}
                  className="rounded bg-teal-500 px-4 py-3 text-white shadow transition hover:scale-105 hover:bg-teal-600"
                >
                  + Add Job
                </button>
              </div>
            }
          >
            {filteredJobs.length > 0 ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {filteredJobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    darkMode={darkMode}
                    onOpen={setSelectedJob}
                    onCall={openCall}
                    onMaps={openMaps}
                    onShare={generateShareImage}
                    onMarkDone={markJobDone}
                    onMarkPaid={markJobPaid}
                    onInvoice={generateInvoice}
                    onDelete={deleteJob}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No jobs match your filters.</p>
            )}
          </SectionCard>
        )}

        {activeTab === "Schedule" && (
          <SectionCard
            title="Schedule"
            darkMode={darkMode}
            rightSlot={
              <button
                onClick={addJob}
                className="rounded bg-teal-500 px-4 py-3 text-white shadow transition hover:scale-105 hover:bg-teal-600"
              >
                + Add Job
              </button>
            }
          >
            {groupedSchedule.length > 0 ? (
              <div className="grid gap-4 xl:grid-cols-2">
                {groupedSchedule.map((group) => (
                  <ScheduleDayCard
                    key={group.date}
                    dateLabel={group.label}
                    jobs={group.jobs}
                    darkMode={darkMode}
                    onOpen={setSelectedJob}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No scheduled jobs yet.</p>
            )}
          </SectionCard>
        )}

        {activeTab === "Calendar" && (
          <SectionCard
            title="Calendar"
            darkMode={darkMode}
            rightSlot={
              <div className="flex items-center gap-2">
                <button
                  onClick={goPrevMonth}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm transition hover:bg-white/10"
                >
                  Prev
                </button>
                <div className="rounded-lg bg-black/10 px-4 py-2 text-sm font-semibold">
                  {calendarTitle}
                </div>
                <button
                  onClick={goNextMonth}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm transition hover:bg-white/10"
                >
                  Next
                </button>
              </div>
            }
          >
            <CalendarGrid
              monthDate={calendarDate}
              jobs={jobs}
              darkMode={darkMode}
              onOpen={setSelectedJob}
            />
          </SectionCard>
        )}

        {activeTab === "Customers" && (
          <SectionCard title="Customers" darkMode={darkMode}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {customerSummaries.map((customer) => (
                <div
                  key={customer.name}
                  className={`rounded-3xl border p-4 shadow-sm ${
                    darkMode
                      ? "border-white/10 bg-gray-900"
                      : "border-black/5 bg-gray-50"
                  }`}
                >
                  <p className="text-lg font-bold">{customer.name}</p>
                  <p className="text-sm text-gray-500">
                    Last vehicle: {customer.lastVehicle || "N/A"}
                  </p>
                  <p className="text-sm text-gray-500">
                    Last booking:{" "}
                    {customer.lastDate
                      ? new Date(customer.lastDate).toLocaleDateString()
                      : "N/A"}
                  </p>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="rounded-full bg-gray-200 px-3 py-1 text-xs text-gray-800 dark:bg-gray-700 dark:text-white">
                      Jobs: {customer.jobs}
                    </span>
                    <span className="font-bold text-teal-500">
                      ${customer.totalSpend.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {activeTab === "Finance" && (
          <>
            <SectionCard
              title="Finance"
              darkMode={darkMode}
              rightSlot={
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                  <p className="text-sm font-semibold">Finance Period:</p>
                  <select
                    value={financePeriod}
                    onChange={(e) => setFinancePeriod(e.target.value)}
                    className="rounded border bg-gray-50 p-3 text-black dark:bg-gray-700 dark:text-white"
                  >
                    <option>All Time</option>
                    <option>This Month</option>
                    <option>This Week</option>
                  </select>
                </div>
              }
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  label="Revenue"
                  value={`$${totalRevenue.toFixed(2)}`}
                  darkMode={darkMode}
                  valueClassName="text-green-500"
                />
                <StatCard
                  label="Expenses"
                  value={`$${totalExpenses.toFixed(2)}`}
                  darkMode={darkMode}
                  valueClassName="text-red-500"
                />
                <StatCard
                  label="Net Profit"
                  value={`$${netProfit.toFixed(2)}`}
                  darkMode={darkMode}
                  valueClassName="text-teal-500"
                />
                <StatCard
                  label="Revenue incl. GST"
                  value={`$${totalRevenueWithGst.toFixed(2)}`}
                  darkMode={darkMode}
                  valueClassName="text-blue-500"
                />
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  label="Paid Revenue"
                  value={`$${paidRevenue.toFixed(2)}`}
                  darkMode={darkMode}
                  valueClassName="text-emerald-500"
                />
                <StatCard
                  label="Unpaid Revenue"
                  value={`$${unpaidRevenue.toFixed(2)}`}
                  darkMode={darkMode}
                  valueClassName="text-red-500"
                />
                <StatCard
                  label="Paid Jobs"
                  value={paidJobsCount}
                  darkMode={darkMode}
                  valueClassName="text-emerald-500"
                />
                <StatCard
                  label="Outstanding"
                  value={`$${outstandingAmount.toFixed(2)}`}
                  darkMode={darkMode}
                  valueClassName="text-orange-500"
                />
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 p-4">
                  <p className="text-sm text-gray-500">Unpaid Jobs</p>
                  <p className="mt-1 text-2xl font-bold text-red-500">
                    {unpaidJobsCount}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 p-4">
                  <p className="text-sm text-gray-500">Cash Collected Rate</p>
                  <p className="mt-1 text-2xl font-bold text-teal-500">
                    {totalRevenue > 0
                      ? `${((paidRevenue / totalRevenue) * 100).toFixed(1)}%`
                      : "0.0%"}
                  </p>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Add Expense" darkMode={darkMode}>
              <form
                onSubmit={addExpense}
                className="grid grid-cols-1 gap-3 md:grid-cols-4"
              >
                <input
                  type="number"
                  step="0.01"
                  placeholder="Amount"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  className="rounded border bg-gray-50 p-3 text-black dark:bg-gray-700 dark:text-white"
                />

                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value)}
                  className="rounded border bg-gray-50 p-3 text-black dark:bg-gray-700 dark:text-white"
                >
                  <option>Products</option>
                  <option>Fuel</option>
                  <option>Marketing</option>
                  <option>Equipment</option>
                  <option>Other</option>
                </select>

                <input
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  className="rounded border bg-gray-50 p-3 text-black dark:bg-gray-700 dark:text-white"
                />

                <button
                  type="submit"
                  className="rounded bg-red-500 px-4 py-3 text-white shadow transition hover:scale-105 hover:bg-red-600"
                >
                  Save Expense
                </button>

                <input
                  type="text"
                  placeholder="Note"
                  value={expenseNote}
                  onChange={(e) => setExpenseNote(e.target.value)}
                  className="md:col-span-4 rounded border bg-gray-50 p-3 text-black dark:bg-gray-700 dark:text-white"
                />
              </form>
            </SectionCard>

            <SectionCard title="Recent Expenses" darkMode={darkMode}>
              {filteredFinanceExpenses.length > 0 ? (
                <div className="space-y-2">
                  {filteredFinanceExpenses.slice(0, 10).map((expense) => (
                    <div
                      key={expense.id}
                      className="flex items-center justify-between rounded-lg border p-3 text-sm dark:border-gray-700"
                    >
                      <div>
                        <p className="font-semibold">
                          {expense.category || "General"}
                        </p>
                        <p className="text-gray-500">
                          {expense.note || "No note"}
                        </p>
                        <p className="text-xs text-gray-400">
                          {expense.date
                            ? new Date(expense.date).toLocaleDateString()
                            : "No date"}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <p className="font-bold text-red-500">
                          ${parseFloat(expense.amount || 0).toFixed(2)}
                        </p>
                        <button
                          onClick={() => deleteExpense(expense.id)}
                          className="rounded bg-red-500 px-3 py-2 text-xs text-white transition hover:scale-105 hover:bg-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No expenses in this period</p>
              )}
            </SectionCard>
          </>
        )}

        {activeTab === "Dilution" && <DilutionCalculator darkMode={darkMode} />}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-black/95 px-3 py-3 backdrop-blur sm:hidden">
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => setActiveTab("Dashboard")}
            className={`rounded-lg px-2 py-3 text-xs font-semibold ${
              activeTab === "Dashboard"
                ? "bg-teal-500 text-white"
                : "bg-gray-800 text-gray-300"
            }`}
          >
            Dash
          </button>
          <button
            onClick={() => setActiveTab("Jobs")}
            className={`rounded-lg px-2 py-3 text-xs font-semibold ${
              activeTab === "Jobs"
                ? "bg-teal-500 text-white"
                : "bg-gray-800 text-gray-300"
            }`}
          >
            Jobs
          </button>
          <button
            onClick={() => setActiveTab("Calendar")}
            className={`rounded-lg px-2 py-3 text-xs font-semibold ${
              activeTab === "Calendar"
                ? "bg-teal-500 text-white"
                : "bg-gray-800 text-gray-300"
            }`}
          >
            Cal
          </button>
          <button
            onClick={() => setActiveTab("Dilution")}
            className={`rounded-lg px-2 py-3 text-xs font-semibold ${
              activeTab === "Dilution"
                ? "bg-teal-500 text-white"
                : "bg-gray-800 text-gray-300"
            }`}
          >
            Mix
          </button>
        </div>
      </div>

      {selectedJob && (
        <JobModal
          job={selectedJob}
          jobs={jobs}
          onClose={() => setSelectedJob(null)}
          onUpdate={updateJob}
          darkMode={darkMode}
          generateInvoice={generateInvoice}
          supabase={supabase}
        />
      )}
    </div>
  )
}