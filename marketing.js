const MARKETING_LANGUAGES = ["pt", "en", "es", "fr"]
const LANGUAGE_LABELS = { pt:"PT", en:"EN", es:"ES", fr:"FR" }
const HTML_LANGS = { pt:"pt-PT", en:"en-GB", es:"es-ES", fr:"fr-FR" }
const translations = window.MarketingTranslations || {}

function deepMerge(base, patch){
  if(patch === undefined || patch === null) return base
  if(base === undefined || base === null) return patch
  if(Array.isArray(patch)) return patch.slice()
  if(typeof patch === "object" && typeof base === "object" && !Array.isArray(base)){
    const out = { ...base }
    for(const key of Object.keys(patch)){
      out[key] = deepMerge(base[key], patch[key])
    }
    return out
  }
  return patch
}

function resolveMarketingTexts(lang){
  const base = translations.en || {}
  if(lang === "en") return deepMerge({}, base)
  return deepMerge(base, translations[lang] || {})
}

const header = document.querySelector(".site-header")
const navToggle = document.querySelector(".nav-toggle")
const siteNav = document.querySelector(".site-nav")
const navLinks = Array.from(document.querySelectorAll(".site-nav > a[href^='#']"))
const revealItems = document.querySelectorAll(".reveal")
const langSelect = document.getElementById("langSelectMarketing")
const contactForm = document.getElementById("contactForm")
const contactFeedback = document.getElementById("contactFeedback")
const contactSubmit = document.getElementById("contactSubmit")
const footerCopyright = document.getElementById("footerCopyright")

let currentLang = "en"
let currentTexts = translations.en || null

function getPath(object, path){
  return String(path || "")
    .split(".")
    .filter(Boolean)
    .reduce((accumulator, key)=>{
      if(accumulator == null) return undefined
      return accumulator[key]
    }, object)
}

function getInitialLang(){
  const saved = localStorage.getItem("bg_lang")
  const detected = saved || String(navigator.language || "en").slice(0, 2).toLowerCase()
  return MARKETING_LANGUAGES.includes(detected) ? detected : "en"
}

function getFormTexts(){
  const fallback = translations.en && translations.en.contact && translations.en.contact.form
  return (currentTexts && currentTexts.contact && currentTexts.contact.form) || fallback || {
    submit: "Send enquiry",
    messages: {
      required: "Please fill in all required fields.",
      email: "Please enter a valid email address.",
      sending: "Sending...",
      success: "Enquiry sent successfully. We will be in touch soon.",
      error: "Something went wrong while sending the form."
    }
  }
}

function applyTextTranslations(texts){
  document.querySelectorAll("[data-i18n]").forEach((node)=>{
    const value = getPath(texts, node.dataset.i18n)
    if(typeof value === "string"){
      node.textContent = value
    }
  })

  document.querySelectorAll("[data-i18n-attr]").forEach((node)=>{
    const mappings = String(node.dataset.i18nAttr || "")
      .split(";")
      .map((item)=> item.trim())
      .filter(Boolean)

    mappings.forEach((mapping)=>{
      const separatorIndex = mapping.indexOf(":")
      if(separatorIndex === -1) return
      const attribute = mapping.slice(0, separatorIndex).trim()
      const path = mapping.slice(separatorIndex + 1).trim()
      const value = getPath(texts, path)
      if(typeof value === "string"){
        node.setAttribute(attribute, value)
      }
    })
  })
}

function applyMetaTranslations(texts){
  const metaTitle = texts && texts.meta && texts.meta.title
  const metaDescription = texts && texts.meta && texts.meta.description

  if(metaTitle){
    document.title = metaTitle
    const titleNode = document.getElementById("metaTitle")
    const ogTitle = document.getElementById("ogTitle")
    const twitterTitle = document.getElementById("twitterTitle")
    if(titleNode) titleNode.textContent = metaTitle
    if(ogTitle) ogTitle.setAttribute("content", metaTitle)
    if(twitterTitle) twitterTitle.setAttribute("content", metaTitle)
  }

  if(metaDescription){
    const descriptionNode = document.getElementById("metaDescription")
    const ogDescription = document.getElementById("ogDescription")
    const twitterDescription = document.getElementById("twitterDescription")
    if(descriptionNode) descriptionNode.setAttribute("content", metaDescription)
    if(ogDescription) ogDescription.setAttribute("content", metaDescription)
    if(twitterDescription) twitterDescription.setAttribute("content", metaDescription)
  }
}

function populateLanguageSelect(){
  if(!langSelect) return
  langSelect.innerHTML = MARKETING_LANGUAGES.map((lang)=>{
    const label = LANGUAGE_LABELS[lang] || lang.toUpperCase()
    return `<option value="${lang}">${label}</option>`
  }).join("")
}

function applyTranslations(lang){
  const normalized = MARKETING_LANGUAGES.includes(lang) ? lang : "en"
  const nextTexts = resolveMarketingTexts(normalized)
  if(!nextTexts || !Object.keys(nextTexts).length) return

  currentLang = normalized
  currentTexts = nextTexts

  document.documentElement.lang = HTML_LANGS[normalized] || normalized
  try{ localStorage.setItem("bg_lang", normalized) }catch(_e){}

  document.documentElement.dir = nextTexts.dir || "ltr"

  applyMetaTranslations(nextTexts)
  applyTextTranslations(nextTexts)

  if(footerCopyright){
    const copyright = getPath(nextTexts, "footer.copyright")
      || getPath(translations.en || {}, "footer.copyright")
      || "© {year}"
    const year = new Date().getFullYear()
    footerCopyright.textContent = copyright.replace("{year}", String(year))
  }

  if(contactSubmit && !contactSubmit.disabled){
    contactSubmit.textContent = getFormTexts().submit
  }

  if(langSelect){
    langSelect.value = normalized
  }

  if(window.BanditStore && typeof window.BanditStore.render === "function"){
    window.BanditStore.render();
  }
  if(window.MotorcycleConfigurator && typeof window.MotorcycleConfigurator.render === "function"){
    window.MotorcycleConfigurator.render();
  }
}

function setHeaderState(){
  if(!header) return
  header.classList.toggle("is-scrolled", window.scrollY > 18)
}

function setMenuState(isOpen){
  if(!navToggle || !siteNav) return
  navToggle.setAttribute("aria-expanded", String(isOpen))
  siteNav.classList.toggle("is-open", isOpen)
}

function showFeedback(message, type){
  if(!contactFeedback) return
  contactFeedback.textContent = message
  contactFeedback.classList.remove("hidden", "is-success", "is-error")
  contactFeedback.classList.add(type === "success" ? "is-success" : "is-error")
}

function validateContactForm(payload){
  const messages = getFormTexts().messages

  if(!payload.name || !payload.email || !payload.phone || !payload.message){
    return messages.required
  }

  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)){
    return messages.email
  }

  return ""
}

populateLanguageSelect()
applyTranslations(getInitialLang())
setHeaderState()

window.addEventListener("scroll", setHeaderState, { passive:true })

if(langSelect){
  langSelect.addEventListener("change", (event)=>{
    applyTranslations(event.target.value)
  })
}

if(navToggle){
  navToggle.addEventListener("click", () => {
    const isOpen = navToggle.getAttribute("aria-expanded") === "true"
    setMenuState(!isOpen)
  })
}

navLinks.forEach((link) => {
  link.addEventListener("click", () => setMenuState(false))
})

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if(entry.isIntersecting){
      const id = `#${entry.target.id}`
      navLinks.forEach((link) => {
        link.classList.toggle("is-active", link.getAttribute("href") === id)
      })
    }
  })
}, {
  rootMargin: "-35% 0px -45% 0px",
  threshold: 0.1
})

document.querySelectorAll("main section[id]").forEach((section) => {
  sectionObserver.observe(section)
})

const revealObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => {
    if(entry.isIntersecting){
      entry.target.classList.add("is-visible")
      observer.unobserve(entry.target)
    }
  })
}, {
  threshold: 0.16
})

revealItems.forEach((item) => revealObserver.observe(item))

if(contactForm){
  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault()

    const payload = Object.fromEntries(new FormData(contactForm).entries())
    const validationError = validateContactForm(payload)
    const formTexts = getFormTexts()

    contactFeedback.classList.add("hidden")
    contactFeedback.classList.remove("is-success", "is-error")

    if(validationError){
      showFeedback(validationError, "error")
      return
    }

    if(contactSubmit){
      contactSubmit.disabled = true
      contactSubmit.textContent = formTexts.messages.sending
    }

    try{
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      })

      const result = await response.json().catch(() => ({ ok:false }))

      if(!response.ok || !result.ok){
        throw new Error(formTexts.messages.error)
      }

      contactForm.reset()
      showFeedback(formTexts.messages.success, "success")
    }catch(_error){
      showFeedback(formTexts.messages.error, "error")
    }finally{
      if(contactSubmit){
        contactSubmit.disabled = false
        contactSubmit.textContent = getFormTexts().submit
      }
    }
  })
}


