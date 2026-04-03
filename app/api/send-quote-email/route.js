import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req) {
  try {
    const body = await req.json()

    const {
      customer_name,
      customer_email,
      customer_phone,
      vehicle,
      service,
      job_date,
      job_address,
      notes,
    } = body

    if (!customer_email || !customer_email.includes("@")) {
      return Response.json(
        { error: "Customer email is missing or invalid." },
        { status: 400 }
      )
    }

    const customerResult = await resend.emails.send({
      from: "The DTL Co. <admin@thedtlco.com>",
      replyTo: "admin@thedtlco.com",
      to: customer_email,
      subject: "We’ve received your enquiry",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 24px; background: #ffffff; color: #111111;">
          <div style="max-width: 620px; margin: 0 auto; border: 1px solid #e5e5e5; border-radius: 12px; overflow: hidden;">
            <div style="padding: 24px; background: #111111; color: #ffffff;">
              <p style="margin: 0; font-size: 11px; letter-spacing: 0.3em; text-transform: uppercase; color: #9ca3af;">
                Premium Auto Detailing
              </p>
              <h1 style="margin: 10px 0 0 0; font-size: 28px;">
                THE DTL CO.
              </h1>
            </div>

            <div style="padding: 24px;">
              <h2 style="margin-top: 0; font-size: 22px; color: #111111;">
                We’ve received your enquiry
              </h2>

              <p style="font-size: 15px; line-height: 1.7; color: #333333;">
                Hi ${customer_name || "there"},
              </p>

              <p style="font-size: 15px; line-height: 1.7; color: #333333;">
                Thanks for reaching out to The DTL Co. We’ve received your enquiry and will be in touch shortly with your quote.
              </p>

              <div style="margin-top: 20px; padding: 18px; background: #f8f8f8; border: 1px solid #e5e5e5; border-radius: 10px;">
                <p style="margin: 8px 0;"><strong>Vehicle:</strong> ${vehicle || "-"}</p>
                <p style="margin: 8px 0;"><strong>Service:</strong> ${service || "-"}</p>
                <p style="margin: 8px 0;"><strong>Preferred Date:</strong> ${job_date || "-"}</p>
                <p style="margin: 8px 0;"><strong>Address:</strong> ${job_address || "-"}</p>
                ${notes ? `<p style="margin: 8px 0;"><strong>Notes:</strong> ${notes}</p>` : ""}
              </div>

              <h3 style="margin: 28px 0 10px 0; font-size: 18px; color: #111111;">
                How to care for your newly cleaned vehicle
              </h3>

              <ul style="margin: 0; padding-left: 18px; color: #333333; line-height: 1.8; font-size: 15px;">
                <li>Avoid washing the vehicle for 5 to 7 days after the detail.</li>
                <li>Use a pH-neutral car shampoo for future washes.</li>
                <li>Dry with a clean microfiber towel to reduce swirl marks.</li>
                <li>Avoid automatic car washes where possible.</li>
                <li>Regular safe maintenance washes will help protect the finish.</li>
              </ul>

              <p style="margin-top: 24px; font-size: 15px; line-height: 1.7; color: #333333;">
                We look forward to working on your vehicle.
              </p>
            </div>

            <div style="padding: 18px 24px; border-top: 1px solid #e5e5e5; background: #fafafa; color: #666666; font-size: 12px; line-height: 1.7;">
              The DTL Co. Auto Detailing<br />
              Eltham Based • Mobile Service Available
            </div>
          </div>
        </div>
      `,
    })

    console.log("CUSTOMER EMAIL RESULT:", customerResult)

    const adminResult = await resend.emails.send({
      from: "The DTL Co. <admin@thedtlco.com>",
      replyTo: "admin@thedtlco.com",
      to: "thedtlco@gmail.com",
      subject: "🚨 New Quote Enquiry Received",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 24px; background: #f6f6f6; color: #111111;">
          <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border: 1px solid #e7e7e7; border-radius: 16px; overflow: hidden;">
            <div style="padding: 24px; background: #111111; color: #ffffff;">
              <p style="margin: 0; font-size: 11px; letter-spacing: 0.3em; text-transform: uppercase; color: #9ca3af;">
                New Enquiry
              </p>
              <h2 style="margin: 10px 0 0 0; font-size: 24px;">
                Quote Request Submitted
              </h2>
            </div>

            <div style="padding: 24px;">
              <p><strong>Name:</strong> ${customer_name || "-"}</p>
              <p><strong>Email:</strong> ${customer_email || "-"}</p>
              <p><strong>Phone:</strong> ${customer_phone || "-"}</p>
              <p><strong>Vehicle:</strong> ${vehicle || "-"}</p>
              <p><strong>Service:</strong> ${service || "-"}</p>
              <p><strong>Preferred Date:</strong> ${job_date || "-"}</p>
              <p><strong>Address:</strong> ${job_address || "-"}</p>
              <p><strong>Notes:</strong> ${notes || "-"}</p>
            </div>
          </div>
        </div>
      `,
    })

    console.log("ADMIN EMAIL RESULT:", adminResult)

    return Response.json({ success: true })
  } catch (error) {
    console.error("SEND QUOTE EMAIL ERROR:", error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}