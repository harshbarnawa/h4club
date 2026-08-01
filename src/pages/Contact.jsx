import Layout from "../components/Layout"
import ContactForm from "../components/ContactForm"
import { useTheme } from "../context/ThemeContext"
import { SocialLinks } from "../constants/social"

function Contact() {
  const { darkMode } = useTheme()

  return (
    <Layout>
      <section
        className={`relative z-10 border-t min-h-screen ${
          darkMode ? "border-[#262626]" : "border-[#d8d8d8]"
        }`}
      >
        <div className="max-w-3xl mx-auto px-5 md:px-6 pt-40 pb-24">
          <h2
            className={`text-[11px] uppercase tracking-[3px] mb-8 ${
              darkMode ? "text-[#7a7a7a]" : "text-[#8a8a8a]"
            }`}
          >
            Contact
          </h2>

          {/* Contact info */}
          <div className="mb-10 space-y-3">
            <a
              href="mailto:harshbarnawa.info@gmail.com"
              className={`block transition break-all ${
                darkMode
                  ? "text-[#a1a1a1] hover:text-white"
                  : "text-[#5f5f5f] hover:text-[#2f2f2f]"
              }`}
            >
              harshbarnawa.info@gmail.com
            </a>

            <a
              href="https://wa.me/916264232915"
              target="_blank"
              rel="noreferrer"
              className={`block transition ${
                darkMode
                  ? "text-[#a1a1a1] hover:text-white"
                  : "text-[#5f5f5f] hover:text-[#2f2f2f]"
              }`}
            >
              +91 62642 32915
            </a>
          </div>

          {/* Contact form */}
          <div
            className={`border rounded-[24px] p-6 md:p-8 mb-10 ${
              darkMode
                ? "border-[#262626] bg-[#151515]/70"
                : "border-[#d8d8d8] bg-[#efefef]/70"
            }`}
          >
            <h3
              className={`text-[13px] uppercase tracking-[2px] mb-6 ${
                darkMode ? "text-[#7a7a7a]" : "text-[#8a8a8a]"
              }`}
            >
              Send a message
            </h3>
            <ContactForm />
          </div>

          {/* Social links */}
          <div className="flex items-center flex-wrap gap-5">
            {SocialLinks.map(({ icon, link, alt }) => (
              <a
                key={alt}
                href={link}
                target="_blank"
                rel="noreferrer"
                aria-label={alt}
              >
                <img
                  src={icon}
                  alt={alt}
                  className={`w-10 h-10 object-contain opacity-60 hover:opacity-100 transition duration-300 ${
                    darkMode ? "invert hover:invert-0" : ""
                  }`}
                />
              </a>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  )
}

export default Contact
