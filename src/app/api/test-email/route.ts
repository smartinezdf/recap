import { Resend } from "resend";

export async function GET() {
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const { error } = await resend.emails.send({
      from: "Recap Alerts <onboarding@resend.dev>",
      to: ["smartinezdf@gmail.com"],
      subject: "✅ Recap – Email test OK",
      html: `
        <h2>Recap Alerts</h2>
        <p>Este es un <strong>email de prueba</strong>.</p>
        <p>Si recibes esto, <b>Resend está configurado correctamente</b>.</p>
        <p>Hora: ${new Date().toLocaleString()}</p>
      `,
    });

    if (error) {
      return new Response(JSON.stringify(error), { status: 500 });
    }

    return new Response("Email sent OK", { status: 200 });
  } catch (e: any) {
    return new Response(e.message || "Error", { status: 500 });
  }
}
