"use client"

import { useState } from "react"

export default function BookingPage() {
  const [form, setForm] = useState({
    customer_name: "",
    customer_phone: "",
    vehicle: "",
    job_address: "",
    job_date: "",
    service: "",
    notes: "",
  })

  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  const updateField = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setSuccess(false)
    setError("")

    try {
      const response = await fetch("/api/book", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit booking")
      }

      setSuccess(true)
      setForm({
        customer_name: "",
        customer_phone: "",
        vehicle: "",
        job_address: "",
        job_date: "",
        service: "",
        notes: "",
      })
    } catch (err) {
      setError(err.message || "Something went wrong")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-black px-4 py-10 text-white">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <img
            src="/logo.png"
            alt="The DTL Co."
            className="mx-auto mb-8 h-32 w-auto object-contain sm:h-40 md:h-44"
          />
          <h1 className="text-3xl font-bold tracking-wide sm:text-4xl">
            Quote Request
          </h1>
          <p className="mt-3 text-sm text-gray-400 sm:text-base">
            Fill out the form below and we’ll get back to you.
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur sm:p-8">
          {success && (
            <div className="mb-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300">
              Quote Request submitted successfully. We’ve received it and will be in
              touch soon.
            </div>
          )}

          {error && (
            <div className="mb-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium">
                  Full Name
                </span>
                <input
                  type="text"
                  required
                  value={form.customer_name}
                  onChange={(e) =>
                    updateField("customer_name", e.target.value)
                  }
                  className="w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white outline-none transition focus:border-teal-500"
                  placeholder="John Smith"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium">
                  Phone Number
                </span>
                <input
                  type="tel"
                  required
                  value={form.customer_phone}
                  onChange={(e) =>
                    updateField("customer_phone", e.target.value)
                  }
                  className="w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white outline-none transition focus:border-teal-500"
                  placeholder="0400 000 000"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium">Vehicle</span>
                <input
                  type="text"
                  required
                  value={form.vehicle}
                  onChange={(e) => updateField("vehicle", e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white outline-none transition focus:border-teal-500"
                  placeholder="BMW M3"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium">
                  Preferred Date
                </span>
                <input
                  type="date"
                  required
                  value={form.job_date}
                  onChange={(e) => updateField("job_date", e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white outline-none transition focus:border-teal-500"
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-medium">Address</span>
              <input
                type="text"
                required
                value={form.job_address}
                onChange={(e) => updateField("job_address", e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white outline-none transition focus:border-teal-500"
                placeholder="Street address"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium">
                Service Wanted
              </span>
              <select
                required
                value={form.service}
                onChange={(e) => updateField("service", e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white outline-none transition focus:border-teal-500"
              >
                <option value="">Select a service</option>
                <option value="Mini Detail">Mini Detail</option>
                <option value="Full Detail">Full Detail</option>
                <option value="Interior Detail">Interior Detail</option>
                <option value="Paint Correction">Paint Correction</option>
                <option value="Ceramic Coating">Ceramic Coating</option>
                <option value="Custom Quote">Custom Quote</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium">
                Extra Notes
              </span>
              <textarea
                rows={5}
                value={form.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white outline-none transition focus:border-teal-500"
                placeholder="Paint condition, stains, dog hair, access notes, anything helpful..."
              />
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 rounded-2xl bg-teal-500 px-5 py-4 font-semibold text-white transition hover:scale-[1.01] hover:bg-teal-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Submitting..." : "Submit Booking"}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}