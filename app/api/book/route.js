import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { Resend } from "resend"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const resendApiKey = process.env.RESEND_API_KEY

export async function POST(request) {
  try {
    const body = await request.json()

    console.log("BODY RECEIVED:", body)
    console.log("ENV CHECK:", {
      url: supabaseUrl,
      key: serviceRoleKey ? "exists" : "missing",
      resend: resendApiKey ? "exists" : "missing",
    })

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Missing Supabase environment variables" },
        { status: 500 }
      )
    }

    if (
      !supabaseUrl.startsWith("https://") ||
      !supabaseUrl.includes(".supabase.co")
    ) {
      return NextResponse.json(
        { error: "Supabase URL format is invalid" },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey)
    const resend = resendApiKey ? new Resend(resendApiKey) : null

    const customer_name = body.customer_name?.trim()
    const customer_phone = body.customer_phone?.trim()
    const vehicle = body.vehicle?.trim()
    const job_address = body.job_address?.trim()
    const service = body.service?.trim()
    const notes = body.notes?.trim() || ""
    const job_date = body.job_date

    if (
      !customer_name ||
      !customer_phone ||
      !vehicle ||
      !job_address ||
      !job_date ||
      !service
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from("jobs")
      .insert([
        {
          customer_name,
          customer_phone,
          vehicle,
          job_address,
          customer_notes: notes,
          job_date,
          status: "Booked",
          payment_status: "Unpaid",
          job_details: [service],
          pricing_breakdown: [],
          before_photos: [],
          after_photos: [],
          price: 0,
        },
      ])
      .select()

    if (error) {
      console.error("SUPABASE INSERT ERROR:", error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    console.log("JOB CREATED:", data)

    if (process.env.BOOKING_ALERT_EMAIL && resend) {
      const { error: emailError } = await resend.emails.send({
        from: "Bookings <onboarding@resend.dev>",
        to: [process.env.BOOKING_ALERT_EMAIL],
        subject: `New Booking: ${customer_name}`,
        html: `
          <h2>New Booking Submitted</h2>
          <p><strong>Name:</strong> ${customer_name}</p>
          <p><strong>Phone:</strong> ${customer_phone}</p>
          <p><strong>Vehicle:</strong> ${vehicle}</p>
          <p><strong>Date:</strong> ${job_date}</p>
          <p><strong>Service:</strong> ${service}</p>
          <p><strong>Address:</strong> ${job_address}</p>
          <p><strong>Notes:</strong> ${notes || "None"}</p>
        `,
      })

      if (emailError) {
        console.error("EMAIL ERROR:", emailError)
      } else {
        console.log("EMAIL SENT SUCCESSFULLY")
      }
    }

    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error("SERVER ERROR:", err)
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    )
  }
}