import express from "express";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import cors from "cors";
import fs from "fs";
import path from "path";
import cron from "node-cron";
import fetch from "node-fetch";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// ============================
// ✅ Middlewares
// ============================
app.use(express.json());
app.use(cors());

// JSON file path
const EMAIL_JSON_PATH = path.join(process.cwd(), "subscribedEmails.json");

// ============================
// 🔹 Helper Functions
// ============================
const readEmails = () => {
  if (!fs.existsSync(EMAIL_JSON_PATH)) {
    fs.writeFileSync(EMAIL_JSON_PATH, JSON.stringify([]));
    return [];
  }
  const data = fs.readFileSync(EMAIL_JSON_PATH, "utf-8");
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
};

const saveEmail = (email) => {
  const emails = readEmails();
  if (!emails.includes(email)) {
    emails.push(email);
    fs.writeFileSync(EMAIL_JSON_PATH, JSON.stringify(emails, null, 2));
  }
};

// ============================
// 📩 Contact Form Route
// ============================
app.post("/api/contact", async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Send email to admin inbox
    await transporter.sendMail({
      from: `"${name}" <${email}>`,
      to: process.env.EMAIL_RECEIVER,
      subject: subject || "New Contact Form Message",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #00BCD4;">New Contact Message</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Subject:</strong> ${subject || "N/A"}</p>
          <p><strong>Message:</strong><br/>${message}</p>
        </div>
      `,
    });

    // Auto reply to user
    await transporter.sendMail({
      from: `"CodEarn Tech" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "✅ Thanks for contacting CodEarn Tech",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 25px;">
          <h2 style="color: #00BCD4;">Hi ${name},</h2>
          <p>Thank you for reaching out to <strong>CodEarn Tech</strong>. 🙌</p>
          <p>We’ll respond to your message within 24 hours.</p>
          <a href="https://codearntech.cloud" style="background:#FF9800; color:white; padding:10px 20px; text-decoration:none; border-radius:6px;">Visit Website</a>
          <p>— CodEarn Tech Team</p>
        </div>
      `,
    });

    res.status(200).json({ success: true, message: "Message sent successfully" });
  } catch (error) {
    console.error("❌ Email Error:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
});

// ============================
// 📧 Subscribe Route
// ============================
app.post("/api/subscribe", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });

  try {
    saveEmail(email);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"CodEarn Tech" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "✅ Subscription Confirmed",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 25px;">
          <h2 style="color:#00BCD4;">Hi there!</h2>
          <p>Thanks for subscribing to <strong>CodEarn Tech</strong> daily updates. 🚀</p>
          <p>You’ll receive our latest news and tutorials daily.</p>
          <a href="https://codearntech.cloud" style="background:#FF9800; color:white; padding:10px 20px; border-radius:6px; text-decoration:none;">Visit CodEarn Tech</a>
        </div>
      `,
    });

    res.status(200).json({ success: true, message: "Subscribed successfully" });
  } catch (err) {
    console.error("❌ Subscribe Error:", err);
    res.status(500).json({ error: "Failed to subscribe" });
  }
});

// ============================
// 📅 Daily Update Mail Cron
// ============================
cron.schedule("0 9 * * *", async () => {
  console.log("🚀 Running daily email job...");

  try {
    const emails = readEmails();
    if (emails.length === 0) return console.log("No subscribed emails.");

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    for (const email of emails) {
      await transporter.sendMail({
        from: `"CodEarn Tech" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "🌟 Daily Updates from CodEarn Tech",
        html: `
          <div style="font-family: Arial, sans-serif; padding:25px;">
            <h2 style="color:#00BCD4;">Hello Subscriber!</h2>
            <p>Here are your daily updates from <strong>CodEarn Tech</strong>. 🚀</p>
            <ul>
              <li>💡 Latest MERN stack tutorials</li>
              <li>⚡ Rapid prototyping tips</li>
              <li>🌐 Web development insights</li>
            </ul>
            <a href="https://codearntech.cloud" style="background:#FF9800; color:white; padding:10px 20px; text-decoration:none; border-radius:8px;">Visit CodEarn Tech</a>
          </div>
        `,
      });
      console.log(`✅ Sent daily email to: ${email}`);
    }
  } catch (err) {
    console.error("❌ Daily Email Error:", err);
  }
});

// ============================
// 🔗 GitHub Repos Route
// ============================
app.get("/api/repos", async (req, res) => {
  try {
    const response = await fetch("https://api.github.com/user/repos", {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("❌ GitHub API Error Response:", errText);
      return res.status(response.status).json({ error: "GitHub API error" });
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("❌ GitHub API Error:", err);
    res.status(500).json({ error: "Failed to fetch GitHub repos" });
  }
});

// ============================
// 🌐 Sitemap Route
// ============================
app.get("/sitemap.xml", (req, res) => {
  try {
    const BASE_URL = "https://codearntech.cloud";

    const pages = [
      { url: "/", priority: "1.0" },
      { url: "/about", priority: "0.9" },
      { url: "/services", priority: "0.9" },
      { url: "/articles", priority: "0.8" },
      { url: "/contact", priority: "0.8" },
      { url: "/privacy-policy", priority: "0.6" },
      { url: "/terms", priority: "0.6" },
    ];

    const blogPosts = [
      { slug: "mern-stack-development", updated: "2025-09-25" },
      { slug: "web-hosting-guide", updated: "2025-09-25" },
      { slug: "future-of-ai", updated: "2025-09-25" },
    ];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    pages.forEach((p) => {
      xml += `  <url>\n    <loc>${BASE_URL}${p.url}</loc>\n    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>\n    <priority>${p.priority}</priority>\n  </url>\n`;
    });

    blogPosts.forEach((post) => {
      xml += `  <url>\n    <loc>${BASE_URL}/blog/${post.slug}</loc>\n    <lastmod>${post.updated}</lastmod>\n    <priority>0.7</priority>\n  </url>\n`;
    });

    xml += `</urlset>`;

    res.header("Content-Type", "application/xml");
    res.send(xml);
  } catch (err) {
    console.error("❌ Sitemap Error:", err);
    res.status(500).send("Error generating sitemap");
  }
});

// ============================
// 🚀 Start Server
// ============================
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
});
