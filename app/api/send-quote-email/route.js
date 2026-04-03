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

    await resend.emails.send({
      from: "The DTL Co. <admin@thedtlco.com>",
      replyto: "admin@thedtlco.com",
      to: customer_email,
      subject: "Your detailing quote enquiry has been received ✨",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 24px; background: #0a0a0a; color: #ffffff;">
          <div style="max-width: 640px; margin: 0 auto; background: #111111; border: 1px solid #222222; border-radius: 16px; overflow: hidden;">
            
            <div style="padding: 28px 28px 20px 28px; background: linear-gradient(180deg, #111111 0%, #0d0d0d 100%);">
              <p style="margin: 0; font-size: 11px; letter-spacing: 0.35em; text-transform: uppercase; color: #7a7a7a;">
                Premium Auto Detailing
              </p>
              <h1 style="margin: 14px 0 0 0; font-size: 28px; line-height: 1.1; letter-spacing: 0.08em;">
                THE DTL CO.
              </h1>
            </div>

            <div style="padding: 28px;">
              <h2 style="margin: 0 0 12px 0; font-size: 22px; color: #ffffff;">
                We’ve received your enquiry
              </h2>

              <p style="margin: 0 0 14px 0; font-size: 15px; line-height: 1.7; color: #d1d1d1;">
                Hi ${customer_name || "there"},
              </p>

              <p style="margin: 0 0 18px 0; font-size: 15px; line-height: 1.7; color: #d1d1d1;">
                Thanks for reaching out to <strong>The DTL Co.</strong>. Your quote enquiry has been received and we’ll be in touch shortly to discuss the vehicle, service requirements, and provide a tailored quote.
              </p>

              <div style="margin: 22px 0; padding: 18px; background: #161616; border: 1px solid #262626; border-radius: 14px;">
                <p style="margin: 0 0 10px 0; font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase; color: #8a8a8a;">
                  Enquiry Summary
                </p>
                <p style="margin: 8px 0; color: #f3f3f3;"><strong>Vehicle:</strong> ${vehicle || "-"}</p>
                <p style="margin: 8px 0; color: #f3f3f3;"><strong>Service:</strong> ${service || "-"}</p>
                <p style="margin: 8px 0; color: #f3f3f3;"><strong>Preferred Date:</strong> ${job_date || "-"}</p>
                <p style="margin: 8px 0; color: #f3f3f3;"><strong>Address:</strong> ${job_address || "-"}</p>
                ${
                  notes
                    ? `<p style="margin: 8px 0; color: #f3f3f3;"><strong>Notes:</strong> ${notes}</p>`
                    : ""
                }
              </div>

              <hr style="margin: 28px 0; border: none; border-top: 1px solid #222222;" />

              <h3 style="margin: 0 0 10px 0; font-size: 18px; color: #ffffff;">
                Leave us a Google review
              </h3>

              <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.7; color: #c9c9c9;">
                If you’ve seen our work before or we’ve looked after your vehicle in the past, a quick review helps support our small business and means a lot.
              </p>

              <a
                href="https://g.page/r/YOUR-GOOGLE-REVIEW-LINK"
                style="display: inline-block; padding: 12px 20px; background: #0ea5a5; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 700;"
              >
                Leave a Review
              </a>

              <hr style="margin: 28px 0; border: none; border-top: 1px solid #222222;" />

              <h3 style="margin: 0 0 10px 0; font-size: 18px; color: #ffffff;">
                How to care for your newly cleaned vehicle
              </h3>

              <ul style="margin: 0; padding-left: 18px; color: #cfcfcf; line-height: 1.8; font-size: 15px;">
                <li>Avoid washing the vehicle for 5 to 7 days after the detail.</li>
                <li>Use a pH-neutral car shampoo for future washes.</li>
                <li>Dry with a clean microfiber towel to reduce swirl marks.</li>
                <li>Avoid automatic car washes where possible.</li>
                <li>Regular safe maintenance washes will help protect the finish.</li>
              </ul>

              <p style="margin: 24px 0 0 0; font-size: 15px; line-height: 1.7; color: #d1d1d1;">
                We look forward to working on your vehicle.
              </p>
            </div>

            <div style="padding: 18px 28px; border-top: 1px solid #222222; background: #0d0d0d; color: #7a7a7a; font-size: 12px; line-height: 1.7;">
              The DTL Co. Auto Detailing<br />
              Eltham Based • Mobile Service Available
            </div>
          </div>
        </div>
      `,
    })

    await resend.emails.send({
      from: "The DTL Co. <admin@thedtlco.com>",
      replyto: "admin@thedtlco.com",
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

    return Response.json({ success: true })
  } catch (error) {
    console.error("SEND QUOTE EMAIL ERROR:", error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}