import { useState } from "react"
import { useTheme } from "../context/ThemeContext"

/*
  📝 CONTACT FORM SETUP:
  This form uses Web3Forms (free tier: 250 submissions/month).
  To make it work:
    1. Go to https://web3forms.com/ and sign up with your email
    2. Get your free Access Key
    3. Replace "YOUR_ACCESS_KEY_HERE" below with your actual key
    4. That's it — no backend needed!
*/

const WEB3FORMS_ACCESS_KEY = "74ea7ac2-2269-40f3-beb4-e3fb31b3e726"

function ContactForm() {
  const { darkMode } = useTheme()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  })
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState("idle") // idle | loading | success | error
  const [serverMsg, setServerMsg] = useState("")

  const validate = () => {
    const errs = {}
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      errs.name = "Name must be at least 2 characters"
    }
    if (!formData.email.trim()) {
      errs.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errs.email = "Please enter a valid email"
    }
    if (!formData.message.trim() || formData.message.trim().length < 10) {
      errs.message = "Message must be at least 10 characters"
    }
    return errs
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    if (WEB3FORMS_ACCESS_KEY === "YOUR_ACCESS_KEY_HERE") {
      // Demo mode — show success without sending
      setStatus("success")
      setServerMsg(
        "Thanks for reaching out! (Form is in demo mode — configure Web3Forms to send real emails)",
      )
      setFormData({ name: "", email: "", message: "" })
      return
    }

    setStatus("loading")
    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_key: WEB3FORMS_ACCESS_KEY,
          name: formData.name,
          email: formData.email,
          message: formData.message,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setStatus("success")
        setServerMsg("Message sent successfully! I'll get back to you soon.")
        setFormData({ name: "", email: "", message: "" })
      } else {
        setStatus("error")
        setServerMsg(data.message || "Something went wrong. Please try again.")
      }
    } catch {
      setStatus("error")
      setServerMsg("Network error. Please try again later.")
    }
  }

  const inputClass = (field) =>
    `w-full bg-transparent border rounded-[12px] px-4 py-3 text-[14px] outline-none transition duration-200 ${
      errors[field]
        ? "border-[#ff5f57]"
        : darkMode
          ? "border-[#2b2b2b] focus:border-[#555]"
          : "border-[#d4d4d4] focus:border-[#999]"
    } ${
      darkMode
        ? "text-[#cfcfcf] placeholder:text-[#555]"
        : "text-[#4a4a4a] placeholder:text-[#aaa]"
    }`

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {/* Name */}
      <div>
        <label
          htmlFor="name"
          className={`text-[11px] uppercase tracking-[2px] mb-2 block ${
            darkMode ? "text-[#7a7a7a]" : "text-[#8a8a8a]"
          }`}
        >
          Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Your name"
          className={inputClass("name")}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "name-error" : undefined}
        />
        {errors.name && (
          <p id="name-error" className="text-[#ff5f57] text-[12px] mt-1">
            {errors.name}
          </p>
        )}
      </div>

      {/* Email */}
      <div>
        <label
          htmlFor="email"
          className={`text-[11px] uppercase tracking-[2px] mb-2 block ${
            darkMode ? "text-[#7a7a7a]" : "text-[#8a8a8a]"
          }`}
        >
          Email
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="your@email.com"
          className={inputClass("email")}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
        />
        {errors.email && (
          <p id="email-error" className="text-[#ff5f57] text-[12px] mt-1">
            {errors.email}
          </p>
        )}
      </div>

      {/* Message */}
      <div>
        <label
          htmlFor="message"
          className={`text-[11px] uppercase tracking-[2px] mb-2 block ${
            darkMode ? "text-[#7a7a7a]" : "text-[#8a8a8a]"
          }`}
        >
          Message
        </label>
        <textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          placeholder="Your message..."
          rows={5}
          className={`${inputClass("message")} resize-none`}
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? "message-error" : undefined}
        />
        {errors.message && (
          <p id="message-error" className="text-[#ff5f57] text-[12px] mt-1">
            {errors.message}
          </p>
        )}
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={status === "loading"}
        className={`px-6 py-3 rounded-[12px] text-[13px] uppercase tracking-[2px] transition duration-300 border ${
          darkMode
            ? "border-[#333] bg-[#1a1a1a] text-[#cfcfcf] hover:bg-[#252525]"
            : "border-[#ccc] bg-[#e8e8e8] text-[#444] hover:bg-[#ddd]"
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {status === "loading" ? "Sending..." : "Send Message"}
      </button>

      {/* Status messages */}
      {status === "success" && (
        <p className="text-[#28c840] text-[13px] mt-3">{serverMsg}</p>
      )}
      {status === "error" && (
        <p className="text-[#ff5f57] text-[13px] mt-3">{serverMsg}</p>
      )}
    </form>
  )
}

export default ContactForm
