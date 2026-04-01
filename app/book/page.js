"use client"

import { useEffect, useRef, useState } from "react"

function RevealSection({ children, delay = 0, className = "" }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setVisible(true), delay)
          observer.unobserve(node)
        }
      },
      { threshold: 0.18 }
    )

    observer.observe(node)

    return () => observer.disconnect()
  }, [delay])

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ease-out ${className} ${
        visible
          ? "translate-y-0 opacity-100 blur-0"
          : "translate-y-10 opacity-0 blur-[2px]"
      }`}
    >
      {children}
    </div>
  )
}

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

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [showHero, setShowHero] = useState(false)
  const [runWipe, setRunWipe] = useState(false)

  useEffect(() => {
    const heroTimer = setTimeout(() => setShowHero(true), 120)
    const wipeTimer = setTimeout(() => setRunWipe(true), 500)

    return () => {
      clearTimeout(heroTimer)
      clearTimeout(wipeTimer)
    }
  }, [])

  const updateField = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setSuccess(false)
    setError("")

    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error)

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
      setLoading(false)
    }
  }

  const fillService = (serviceName) => {
    setForm((prev) => ({
      ...prev,
      service: serviceName,
    }))

    const formElement = document.getElementById("booking-form")
    if (formElement) {
      formElement.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-black text-white">
      <section className="relative px-4 pb-12 pt-10 sm:pt-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_38%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-white/10" />

        <div className="mx-auto max-w-6xl">
          <div
            className={`mx-auto max-w-4xl text-center transition-all duration-[1400ms] ease-out ${
              showHero
                ? "translate-y-0 opacity-100"
                : "translate-y-8 opacity-0"
            }`}
          >
            <div className="relative mx-auto mb-10 flex w-fit items-center justify-center">
              <div className="absolute h-48 w-48 rounded-full bg-white/10 blur-3xl sm:h-64 sm:w-64" />
              <div className="absolute h-28 w-28 rounded-full bg-white/5 blur-2xl sm:h-36 sm:w-36" />

              <div className="relative overflow-hidden rounded-2xl">
                <img
                  src="/logo.png"
                  alt="The DTL Co."
                  className="relative z-10 mx-auto h-32 w-auto object-contain drop-shadow-[0_0_32px_rgba(255,255,255,0.14)] sm:h-40 md:h-44"
                />

                <div
                  className={`pointer-events-none absolute inset-y-0 -left-1/3 z-20 w-1/3 skew-x-[-20deg] bg-gradient-to-r from-transparent via-white/35 to-transparent blur-md ${
                    runWipe
                      ? "animate-[polishWipe_1.5s_ease-in-out_forwards]"
                      : ""
                  }`}
                />
              </div>
            </div>

            <p className="mb-4 text-[10px] uppercase tracking-[0.5em] text-gray-500 sm:text-xs">
              Premium Auto Detailing
            </p>

            <h1 className="text-4xl font-bold leading-[1.05] sm:text-5xl md:text-6xl">
              Correction, Protection,
              <br className="hidden sm:block" />
              and Finish-First Detailing
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-gray-400 sm:text-base">
              Mobile detailing built around gloss, refinement, and long-term
              care. Book your vehicle below and we’ll get your detail locked in
              properly.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href="#booking-form"
                className="rounded-2xl bg-white px-6 py-3 font-semibold text-black transition duration-300 hover:scale-[1.02] hover:opacity-90"
              >
                Book Now
              </a>

              <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-gray-300 backdrop-blur">
                Eltham Based • Mobile Service Available
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <RevealSection>
            <div className="mb-6">
              <h2 className="text-2xl font-bold sm:text-3xl">
                Popular Services
              </h2>
              <p className="mt-2 text-sm text-gray-400">
                Choose a starting point and we’ll confirm the final details
                after booking.
              </p>
            </div>
          </RevealSection>

          <div className="grid gap-4 md:grid-cols-3">
            <RevealSection delay={0}>
              <button
                onClick={() => fillService("Mini Detail")}
                className="group h-full w-full rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-left shadow-[0_20px_60px_rgba(0,0,0,0.25)] transition duration-500 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.08]"
              >
                <p className="text-xs uppercase tracking-[0.35em] text-gray-500">
                  Entry Refresh
                </p>
                <h3 className="mt-3 text-xl font-bold">Mini Detail</h3>
                <p className="mt-3 text-sm leading-6 text-gray-400">
                  A maintenance-focused refresh for vehicles needing a tidy-up,
                  light enhancement, and gloss boost.
                </p>
                <p className="mt-5 text-sm font-semibold text-white/90 group-hover:text-white">
                  Choose this service →
                </p>
              </button>
            </RevealSection>

            <RevealSection delay={120}>
              <button
                onClick={() => fillService("Full Detail")}
                className="group h-full w-full rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-left shadow-[0_20px_60px_rgba(0,0,0,0.25)] transition duration-500 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.08]"
              >
                <p className="text-xs uppercase tracking-[0.35em] text-gray-500">
                  Full Reset
                </p>
                <h3 className="mt-3 text-xl font-bold">Full Detail</h3>
                <p className="mt-3 text-sm leading-6 text-gray-400">
                  A deeper interior and exterior transformation for vehicles
                  needing a more complete clean and presentation upgrade.
                </p>
                <p className="mt-5 text-sm font-semibold text-white/90 group-hover:text-white">
                  Choose this service →
                </p>
              </button>
            </RevealSection>

            <RevealSection delay={240}>
              <button
                onClick={() => fillService("Paint Correction")}
                className="group h-full w-full rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-left shadow-[0_20px_60px_rgba(0,0,0,0.25)] transition duration-500 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.08]"
              >
                <p className="text-xs uppercase tracking-[0.35em] text-gray-500">
                  Signature Work
                </p>
                <h3 className="mt-3 text-xl font-bold">Paint Correction</h3>
                <p className="mt-3 text-sm leading-6 text-gray-400">
                  Refinement work focused on gloss, clarity, and defect
                  reduction for a sharper, deeper finish.
                </p>
                <p className="mt-5 text-sm font-semibold text-white/90 group-hover:text-white">
                  Choose this service →
                </p>
              </button>
            </RevealSection>
          </div>
        </div>
      </section>

      <section className="px-4 py-8">
        <div className="mx-auto max-w-6xl grid gap-4 md:grid-cols-3">
          <RevealSection delay={0}>
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
              <h3 className="text-lg font-semibold">Premium Focus</h3>
              <p className="mt-3 text-sm leading-6 text-gray-400">
                Built around finish quality, refinement, and protection rather
                than rushed volume-based work.
              </p>
            </div>
          </RevealSection>

          <RevealSection delay={120}>
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
              <h3 className="text-lg font-semibold">Mobile Convenience</h3>
              <p className="mt-3 text-sm leading-6 text-gray-400">
                Based in Eltham with mobile service available, making premium
                detailing easier to fit into your week.
              </p>
            </div>
          </RevealSection>

          <RevealSection delay={240}>
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
              <h3 className="text-lg font-semibold">Straightforward Booking</h3>
              <p className="mt-3 text-sm leading-6 text-gray-400">
                Submit once, lock in your details, and your booking drops
                straight into the system for fast follow-up.
              </p>
            </div>
          </RevealSection>
        </div>
      </section>

      <section id="booking-form" className="px-4 pb-14 pt-8">
        <div className="mx-auto max-w-3xl">
          <RevealSection>
            <div className="mb-6 text-center">
              <p className="text-xs uppercase tracking-[0.35em] text-gray-500">
                Secure Booking
              </p>
              <h2 className="mt-3 text-2xl font-bold sm:text-3xl">
                Lock In Your Detail
              </h2>
              <p className="mt-3 text-sm text-gray-400 sm:text-base">
                Fill out the form below and we’ll get your booking into the
                system.
              </p>
            </div>
          </RevealSection>

          <RevealSection delay={120}>
            <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-5 shadow-[0_25px_80px_rgba(0,0,0,0.35)] backdrop-blur sm:p-8">
              {success && (
                <div className="mb-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300">
                  Booking secured. We’ll be in touch shortly to confirm details.
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
                      className="w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white outline-none transition duration-300 focus:border-teal-500 focus:bg-black/50"
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
                      className="w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white outline-none transition duration-300 focus:border-teal-500 focus:bg-black/50"
                      placeholder="0400 000 000"
                    />
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium">
                      Vehicle
                    </span>
                    <input
                      type="text"
                      required
                      value={form.vehicle}
                      onChange={(e) => updateField("vehicle", e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white outline-none transition duration-300 focus:border-teal-500 focus:bg-black/50"
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
                      className="w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white outline-none transition duration-300 focus:border-teal-500 focus:bg-black/50"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium">
                    Address
                  </span>
                  <input
                    type="text"
                    required
                    value={form.job_address}
                    onChange={(e) => updateField("job_address", e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white outline-none transition duration-300 focus:border-teal-500 focus:bg-black/50"
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
                    className="w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white outline-none transition duration-300 focus:border-teal-500 focus:bg-black/50"
                  >
                    <option value="">Select service</option>
                    <option value="Mini Detail">Mini Detail</option>
                    <option value="Full Detail">Full Detail</option>
                    <option value="Paint Correction">Paint Correction</option>
                    <option value="Ceramic Coating">Ceramic Coating</option>
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium">Notes</span>
                  <textarea
                    placeholder="Paint condition, stains, dog hair, access notes, anything helpful..."
                    value={form.notes}
                    onChange={(e) => updateField("notes", e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white outline-none transition duration-300 focus:border-teal-500 focus:bg-black/50"
                    rows={5}
                  />
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="relative w-full overflow-hidden rounded-2xl bg-white p-3 font-bold text-black transition duration-300 hover:opacity-95 disabled:opacity-60"
                >
                  <span className="relative z-10">
                    {loading ? "Submitting..." : "Submit Booking"}
                  </span>

                  <span className="pointer-events-none absolute inset-0">
                    <span className="absolute inset-y-0 -left-1/2 w-1/2 skew-x-[-20deg] bg-gradient-to-r from-transparent via-white/60 to-transparent opacity-0 animate-[buttonShimmer_3.8s_linear_infinite]" />
                  </span>
                </button>
              </form>
            </div>
          </RevealSection>
        </div>
      </section>

      <style jsx global>{`
        html {
          scroll-behavior: smooth;
        }

        @keyframes polishWipe {
          0% {
            transform: translateX(-220%) skewX(-20deg);
            opacity: 0;
          }
          12% {
            opacity: 0.15;
          }
          35% {
            opacity: 0.8;
          }
          60% {
            opacity: 0.55;
          }
          100% {
            transform: translateX(520%) skewX(-20deg);
            opacity: 0;
          }
        }

        @keyframes buttonShimmer {
          0% {
            transform: translateX(-150%) skewX(-20deg);
            opacity: 0;
          }
          15% {
            opacity: 0.4;
          }
          50% {
            transform: translateX(250%) skewX(-20deg);
            opacity: 0.25;
          }
          100% {
            transform: translateX(250%) skewX(-20deg);
            opacity: 0;
          }
        }
      `}</style>
    </main>
  )
}