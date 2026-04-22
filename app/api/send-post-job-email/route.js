import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req) {
  try {
    const body = await req.json()

    const {
      customer_name,
      customer_email,
      vehicle,
      service,
    } = body

    if (!customer_email) {
      return Response.json({ error: "Missing customer email" }, { status: 400 })
    }

    await resend.emails.send({
      from: "The DTL Co. <admin@thedtlco.com>",
      reply_to: "admin@thedtlco.com",
      to: customer_email,
      subject: "Your vehicle is complete ✨",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 24px; background: #0a0a0a; color: #ffffff;">
          <div style="max-width: 640px; margin: 0 auto; background: #111111; border: 1px solid #222222; border-radius: 16px; overflow: hidden;">
            
            <div style="padding: 28px; background: linear-gradient(180deg, #111111 0%, #0d0d0d 100%);">
              <p style="margin: 0; font-size: 11px; letter-spacing: 0.35em; text-transform: uppercase; color: #7a7a7a;">
                Premium Auto Detailing
              </p>
              <h1 style="margin: 14px 0 0 0; font-size: 28px;">
                THE DTL CO.
              </h1>
            </div>

            <div style="padding: 28px;">
              <h2 style="margin-bottom: 12px;">Your vehicle is complete</h2>

              <p style="color:#d1d1d1;">Hi ${customer_name || "there"},</p>

              <p style="color:#d1d1d1;">
                Your ${vehicle || "vehicle"} has now been completed and is ready.
                Thank you for trusting <strong>The DTL Co.</strong> with your detail.
              </p>

              <div style="margin: 20px 0; padding: 16px; background:#161616; border-radius:12px;">
                <p><strong>Service:</strong> ${service || "-"}</p>
              </div>

              <hr style="border-color:#222; margin: 24px 0;" />

              <h3>⭐ Leave a Review</h3>
              <p style="color:#c9c9c9;">
                If you’re happy with the result, we'd really appreciate a quick 60 second review - it helps a small business like ours grow.
              </p>

              <a href="https://www.google.com/search?q=The+DTL+Co.+Auto+Detailing&stick=H4sIAAAAAAAA_-NgU1I1qDAzNzY3MDUyMjM3MUwyMrC0MqhINbVMTUwzT0o1Tk5KNkw2XMQqFZKRquAS4qPgnK-n4Fhakq_gklqSmJmTmZcOAIcdnvpGAAAA&hl=en-GB&mat=CZRJDH11BxBDElYBTVDHnj2fYbHPyv0r4zU_ACGwLgVhu9mL5oyiOaXrF-Cyq3SdDL7rZHPBqExjMVy5xD7NVLyOKW97emnbZq9tSC6NYnBb9yi9jn7Mcql6WRYTwHiziA&authuser=0&ved=2ahUKEwjlst_StYGUAxVHS2cHHQ7ADOoQ-MgIegQILhAf#"
                 style="display:inline-block; margin-top:10px; padding:12px 20px; background:#0ea5a5; color:white; text-decoration:none; border-radius:10px;">
                 Leave a Review
              </a>

              <hr style="border-color:#222; margin: 24px 0;" />

              <h3>🧼 Aftercare Tips</h3>
              <ul style="color:#cfcfcf; line-height:1.8;">
                <li>Avoid washing for 5–7 days</li>
                <li>Use pH-neutral shampoo only</li>
                <li>Dry with microfiber towel</li>
                <li>Avoid automatic car washes</li>
                <li>Maintain with safe washing methods</li>
              </ul>

              <p style="margin-top:20px; color:#d1d1d1;">
                We look forward to seeing you again.
              </p>
            </div>

            <div style="padding:18px; border-top:1px solid #222; background:#0d0d0d; font-size:12px; color:#777;">
              The DTL Co. Auto Detailing<br/>
              Eltham Based • Mobile Service
            </div>
          </div>
        </div>
      `,
    })

    return Response.json({ success: true })
  } catch (error) {
    console.error("POST JOB EMAIL ERROR:", error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}