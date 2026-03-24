"use client"

import { useEffect, useMemo, useState } from "react"
import jsPDF from "jspdf"
import { supabase } from "@/lib/supabaseClient"

function TabButton({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`min-w-[110px] rounded-xl px-4 py-3 text-sm font-semibold transition ${
        active
          ? "bg-teal-500 text-white shadow"
          : "bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
      }`}
    >
      {label}
    </button>
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

      {uploading && (
        <p className="mb-3 text-sm text-gray-500">Uploading...</p>
      )}

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
}) {
  if (!job) return null

  const [customer, setCustomer] = useState(job.customer_name || "")
  const [phone, setPhone] = useState(job.customer_phone || "")
  const [vehicle, setVehicle] = useState(job.vehicle || "")
  const [address, setAddress] = useState(job.job_address || "")
  const [customerNotes, setCustomerNotes] = useState(job.customer_notes || "")
  const [date, setDate] = useState(
    job.job_date || new Date().toISOString().split("T")[0]
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
                    onClick={() => setDetails([...details, ""])}
                    className="text-sm text-teal-500 hover:underline"
                  >
                    + Add Detail
                  </button>
                </div>

                {details.map((detail, index) => (
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
                      setPricing([...pricing, { service: "", cost: "" }])
                    }
                    className="text-sm text-teal-500 hover:underline"
                  >
                    + Add Line
                  </button>
                </div>

                {pricing.map((item, index) => (
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
                              <span
                                className={`rounded-full px-2 py-1 text-xs text-white ${
                                  historyJob.status === "Booked"
                                    ? "bg-blue-500"
                                    : historyJob.status === "In Progress"
                                    ? "bg-yellow-500"
                                    : "bg-green-500"
                                }`}
                              >
                                {historyJob.status}
                              </span>
                              <span
                                className={`rounded-full px-2 py-1 text-xs text-white ${
                                  (historyJob.payment_status || "Unpaid") ===
                                  "Paid"
                                    ? "bg-emerald-600"
                                    : "bg-red-500"
                                }`}
                              >
                                {historyJob.payment_status || "Unpaid"}
                              </span>
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

export default function Dashboard() {
  const [jobs, setJobs] = useState([])
  const [expenses, setExpenses] = useState([])
  const [selectedJob, setSelectedJob] = useState(null)
  const [darkMode, setDarkMode] = useState(false)
  const [filterStatus, setFilterStatus] = useState("All")
  const [filterDate, setFilterDate] = useState("")
  const [financePeriod, setFinancePeriod] = useState("All Time")
  const [activeTab, setActiveTab] = useState("Dashboard")

  const [expenseAmount, setExpenseAmount] = useState("")
  const [expenseCategory, setExpenseCategory] = useState("Products")
  const [expenseNote, setExpenseNote] = useState("")
  const [expenseDate, setExpenseDate] = useState(
    new Date().toISOString().split("T")[0]
  )

  useEffect(() => {
    fetchJobs()
    fetchExpenses()
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
    } catch (e) {
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

  const filteredJobs = useMemo(() => {
    return jobs
      .filter((job) => !filterDate || job.job_date === filterDate)
      .filter((job) => filterStatus === "All" || job.status === filterStatus)
      .sort((a, b) => new Date(a.job_date) - new Date(b.job_date))
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

  const netProfit = totalRevenue - totalExpenses
  const totalRevenueWithGst = totalRevenue * 1.1
  const outstandingAmount = unpaidRevenue

  const today = new Date().toISOString().split("T")[0]
  const todaysJobs = jobs.filter((job) => job.job_date === today)

  const statusColors = {
    Booked: "bg-blue-500",
    "In Progress": "bg-yellow-500",
    Done: "bg-green-500",
  }

  const customerSummaries = useMemo(() => {
    const grouped = {}

    jobs.forEach((job) => {
      const name = (job.customer_name || "Unknown Customer").trim()
      const total =
        job.pricing_breakdown?.reduce(
          (sum, item) => sum + (parseFloat(item.cost) || 0),
          0
        ) || job.price || 0

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

    return Object.values(grouped).sort(
      (a, b) => b.totalSpend - a.totalSpend
    )
  }, [jobs])

  return (
    <div
      className={`min-h-screen pb-24 transition-colors sm:pb-6 ${
        darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"
      }`}
    >
      <div className="border-b border-white/10 bg-black shadow-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <img
              src="/logo.png"
              alt="The DTL Co. logo"
              className="h-12 w-auto object-contain sm:h-16"
            />
            <div className="hidden sm:block">
              <p className="text-lg font-bold tracking-[0.2em] text-white">
                THE DTL CO.
              </p>
              <p className="text-xs tracking-[0.4em] text-gray-400">
                AUTO DETAILING CRM
              </p>
            </div>
          </div>

          <button
            onClick={() => setDarkMode(!darkMode)}
            className="rounded-lg bg-gray-800 px-3 py-2 text-sm text-white transition hover:scale-105 hover:bg-gray-700"
          >
            {darkMode ? "Light" : "Dark"}
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
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
              label="Customers"
              active={activeTab === "Customers"}
              onClick={() => setActiveTab("Customers")}
            />
            <TabButton
              label="Finance"
              active={activeTab === "Finance"}
              onClick={() => setActiveTab("Finance")}
            />
          </div>
        </div>

        {activeTab === "Dashboard" && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className={`rounded-2xl p-4 shadow ${darkMode ? "bg-gray-800" : "bg-white"}`}>
                <p className="text-sm text-gray-500">Total Jobs</p>
                <p className="mt-1 text-2xl font-bold">{jobs.length}</p>
              </div>
              <div className={`rounded-2xl p-4 shadow ${darkMode ? "bg-gray-800" : "bg-white"}`}>
                <p className="text-sm text-gray-500">Revenue</p>
                <p className="mt-1 text-2xl font-bold text-green-500">${totalRevenue.toFixed(2)}</p>
              </div>
              <div className={`rounded-2xl p-4 shadow ${darkMode ? "bg-gray-800" : "bg-white"}`}>
                <p className="text-sm text-gray-500">Expenses</p>
                <p className="mt-1 text-2xl font-bold text-red-500">${totalExpenses.toFixed(2)}</p>
              </div>
              <div className={`rounded-2xl p-4 shadow ${darkMode ? "bg-gray-800" : "bg-white"}`}>
                <p className="text-sm text-gray-500">Net Profit</p>
                <p className="mt-1 text-2xl font-bold text-teal-500">${netProfit.toFixed(2)}</p>
              </div>
            </div>

            <div className={`rounded-2xl p-4 shadow ${darkMode ? "bg-gray-800/90" : "bg-white/90"}`}>
              <h3 className="mb-2 text-sm font-semibold">Today's Bookings</h3>
              {todaysJobs.length > 0 ? (
                <div className="space-y-2">
                  {todaysJobs.map((job) => (
                    <div
                      key={job.id}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="truncate">
                        {job.customer_name} • {job.vehicle}
                      </span>
                      <div className="flex gap-2">
                        <span
                          className={`shrink-0 rounded-full px-2 py-1 text-xs text-white ${
                            statusColors[job.status] || "bg-gray-500"
                          }`}
                        >
                          {job.status}
                        </span>
                        <span
                          className={`shrink-0 rounded-full px-2 py-1 text-xs text-white ${
                            (job.payment_status || "Unpaid") === "Paid"
                              ? "bg-emerald-600"
                              : "bg-red-500"
                          }`}
                        >
                          {job.payment_status || "Unpaid"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No jobs booked today</p>
              )}
            </div>
          </>
        )}

        {activeTab === "Jobs" && (
          <>
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

            <div className="space-y-4">
              {filteredJobs.map((job) => {
                const total =
                  job.pricing_breakdown?.reduce(
                    (sum, item) => sum + (parseFloat(item.cost) || 0),
                    0
                  ) || job.price || 0

                const gst = total * 0.1
                const finalTotal = total + gst
                const paymentStatus = job.payment_status || "Unpaid"
                const beforePreview = job.before_photos?.[0]
                const afterPreview = job.after_photos?.[0]

                return (
                  <div
                    key={job.id}
                    onClick={() => setSelectedJob(job)}
                    className={`cursor-pointer rounded-2xl p-4 shadow-md transition hover:shadow-xl ${
                      darkMode ? "bg-gray-800/90" : "bg-white/90"
                    }`}
                  >
                    <div className="flex flex-col gap-4">
                      <div className="space-y-1">
                        <p className="flex items-center gap-2 font-semibold">
                          <span
                            className={`h-3 w-3 rounded-full ${
                              statusColors[job.status] || "bg-gray-500"
                            }`}
                          ></span>
                          {job.customer_name}
                        </p>
                        <p className="text-sm text-gray-500">{job.vehicle}</p>
                        {job.customer_phone && (
                          <p className="text-sm text-gray-500">
                            {job.customer_phone}
                          </p>
                        )}
                        {job.job_address && (
                          <p className="truncate text-sm text-gray-500">
                            {job.job_address}
                          </p>
                        )}
                        {job.customer_notes && (
                          <p className="line-clamp-2 text-xs text-gray-400">
                            Notes: {job.customer_notes}
                          </p>
                        )}
                        <div className="flex gap-3 text-xs text-gray-400">
                          <span>Before: {job.before_photos?.length || 0}</span>
                          <span>After: {job.after_photos?.length || 0}</span>
                        </div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Date:{" "}
                          {job.job_date
                            ? new Date(job.job_date).toLocaleDateString()
                            : "Not set"}
                        </p>
                        {job.job_details?.[0] && (
                          <p className="truncate text-xs text-gray-400">
                            {job.job_details[0]}
                          </p>
                        )}
                      </div>

                      {(beforePreview || afterPreview) && (
                        <div
                          className={`rounded-2xl border p-3 ${
                            darkMode
                              ? "border-gray-700 bg-gray-900"
                              : "border-gray-200 bg-gray-50"
                          }`}
                        >
                          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Before / After
                          </p>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="mb-2 text-xs font-medium text-gray-500">
                                Before
                              </p>
                              {beforePreview ? (
                                <img
                                  src={beforePreview}
                                  alt="Before preview"
                                  className="h-28 w-full rounded-xl border object-cover"
                                />
                              ) : (
                                <div className="flex h-28 items-center justify-center rounded-xl border border-dashed text-xs text-gray-400">
                                  No before photo
                                </div>
                              )}
                            </div>

                            <div>
                              <p className="mb-2 text-xs font-medium text-gray-500">
                                After
                              </p>
                              {afterPreview ? (
                                <img
                                  src={afterPreview}
                                  alt="After preview"
                                  className="h-28 w-full rounded-xl border object-cover"
                                />
                              ) : (
                                <div className="flex h-28 items-center justify-center rounded-xl border border-dashed text-xs text-gray-400">
                                  No after photo
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-1 text-xs text-white ${
                            statusColors[job.status] || "bg-gray-500"
                          }`}
                        >
                          {job.status}
                        </span>

                        <span
                          className={`rounded-full px-2 py-1 text-xs text-white ${
                            paymentStatus === "Paid"
                              ? "bg-emerald-600"
                              : "bg-red-500"
                          }`}
                        >
                          {paymentStatus}
                        </span>

                        <p className="mr-auto text-lg font-semibold text-teal-600">
                          ${finalTotal.toFixed(2)}
                        </p>

                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            openCall(job.customer_phone)
                          }}
                          className="rounded bg-gray-700 px-3 py-2 text-xs text-white transition hover:scale-105 hover:bg-gray-600"
                        >
                          Call
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            openMaps(job.job_address)
                          }}
                          className="rounded bg-indigo-600 px-3 py-2 text-xs text-white transition hover:scale-105 hover:bg-indigo-500"
                        >
                          Maps
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            generateShareImage(job)
                          }}
                          className="rounded bg-purple-600 px-3 py-2 text-xs text-white transition hover:scale-105 hover:bg-purple-500"
                        >
                          Share
                        </button>

                        {job.status !== "Done" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              markJobDone(job.id)
                            }}
                            className="rounded bg-green-600 px-3 py-2 text-xs text-white transition hover:scale-105 hover:bg-green-500"
                          >
                            Mark Done
                          </button>
                        )}

                        {paymentStatus !== "Paid" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              markJobPaid(job.id)
                            }}
                            className="rounded bg-emerald-600 px-3 py-2 text-xs text-white transition hover:scale-105 hover:bg-emerald-500"
                          >
                            Mark Paid
                          </button>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            generateInvoice(job)
                          }}
                          className="rounded bg-blue-500 px-3 py-2 text-xs text-white transition hover:scale-105"
                        >
                          Invoice
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteJob(job.id)
                          }}
                          className="rounded bg-red-500 px-3 py-2 text-xs text-white transition hover:scale-105 hover:bg-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {activeTab === "Customers" && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {customerSummaries.map((customer) => (
              <div
                key={customer.name}
                className={`rounded-2xl p-4 shadow ${
                  darkMode ? "bg-gray-800" : "bg-white"
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
        )}

        {activeTab === "Finance" && (
          <>
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

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className={`rounded-2xl p-4 shadow ${darkMode ? "bg-gray-800" : "bg-white"}`}>
                <p className="text-sm text-gray-500">Revenue</p>
                <p className="mt-1 text-2xl font-bold text-green-500">
                  ${totalRevenue.toFixed(2)}
                </p>
              </div>
              <div className={`rounded-2xl p-4 shadow ${darkMode ? "bg-gray-800" : "bg-white"}`}>
                <p className="text-sm text-gray-500">Expenses</p>
                <p className="mt-1 text-2xl font-bold text-red-500">
                  ${totalExpenses.toFixed(2)}
                </p>
              </div>
              <div className={`rounded-2xl p-4 shadow ${darkMode ? "bg-gray-800" : "bg-white"}`}>
                <p className="text-sm text-gray-500">Net Profit</p>
                <p className="mt-1 text-2xl font-bold text-teal-500">
                  ${netProfit.toFixed(2)}
                </p>
              </div>
              <div className={`rounded-2xl p-4 shadow ${darkMode ? "bg-gray-800" : "bg-white"}`}>
                <p className="text-sm text-gray-500">Revenue incl. GST</p>
                <p className="mt-1 text-2xl font-bold text-blue-500">
                  ${totalRevenueWithGst.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className={`rounded-2xl p-4 shadow ${darkMode ? "bg-gray-800" : "bg-white"}`}>
                <p className="text-sm text-gray-500">Paid Revenue</p>
                <p className="mt-1 text-2xl font-bold text-emerald-500">
                  ${paidRevenue.toFixed(2)}
                </p>
              </div>
              <div className={`rounded-2xl p-4 shadow ${darkMode ? "bg-gray-800" : "bg-white"}`}>
                <p className="text-sm text-gray-500">Unpaid Revenue</p>
                <p className="mt-1 text-2xl font-bold text-red-500">
                  ${unpaidRevenue.toFixed(2)}
                </p>
              </div>
              <div className={`rounded-2xl p-4 shadow ${darkMode ? "bg-gray-800" : "bg-white"}`}>
                <p className="text-sm text-gray-500">Paid Jobs</p>
                <p className="mt-1 text-2xl font-bold text-emerald-500">
                  {paidJobsCount}
                </p>
              </div>
              <div className={`rounded-2xl p-4 shadow ${darkMode ? "bg-gray-800" : "bg-white"}`}>
                <p className="text-sm text-gray-500">Outstanding</p>
                <p className="mt-1 text-2xl font-bold text-orange-500">
                  ${outstandingAmount.toFixed(2)}
                </p>
              </div>
            </div>

            <div className={`rounded-2xl p-4 shadow ${darkMode ? "bg-gray-800" : "bg-white"}`}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-gray-200/20 p-4">
                  <p className="text-sm text-gray-500">Unpaid Jobs</p>
                  <p className="mt-1 text-2xl font-bold text-red-500">
                    {unpaidJobsCount}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200/20 p-4">
                  <p className="text-sm text-gray-500">Cash Collected Rate</p>
                  <p className="mt-1 text-2xl font-bold text-teal-500">
                    {totalRevenue > 0
                      ? `${((paidRevenue / totalRevenue) * 100).toFixed(1)}%`
                      : "0.0%"}
                  </p>
                </div>
              </div>
            </div>

            <div className={`rounded-2xl p-4 shadow ${darkMode ? "bg-gray-800" : "bg-white"}`}>
              <h3 className="mb-4 text-sm font-semibold">Add Expense</h3>
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
            </div>

            <div className={`rounded-2xl p-4 shadow ${darkMode ? "bg-gray-800" : "bg-white"}`}>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold">Recent Expenses</h3>
                <p className="text-sm text-gray-500">
                  Showing: ${totalExpenses.toFixed(2)}
                </p>
              </div>

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
                <p className="text-sm text-gray-500">
                  No expenses in this period
                </p>
              )}
            </div>
          </>
        )}
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
            Dashboard
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
            onClick={() => setActiveTab("Customers")}
            className={`rounded-lg px-2 py-3 text-xs font-semibold ${
              activeTab === "Customers"
                ? "bg-teal-500 text-white"
                : "bg-gray-800 text-gray-300"
            }`}
          >
            Customers
          </button>
          <button
            onClick={() => setActiveTab("Finance")}
            className={`rounded-lg px-2 py-3 text-xs font-semibold ${
              activeTab === "Finance"
                ? "bg-teal-500 text-white"
                : "bg-gray-800 text-gray-300"
            }`}
          >
            Finance
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
        />
      )}
    </div>
  )
}