import type { InquiryBannerCode, InquiryErrorCode } from "@/lib/validation/inquiry";

// Bahasa Melayu — the public site's main language and the master copy: the
// English dictionary (en.ts) must have exactly the same entries. "{name}"
// placeholders are filled with fmt() from lib/i18n/config.ts.
//
// Only what the site itself says lives here. Content admins type in (package
// details, announcements, gallery labels, reviews) is shown as entered, and
// the editable homepage/About texts have their own Malay + English fields
// (lib/site-content.ts).

export const ms = {
  meta: {
    ogLocale: "ms_MY",
    siteTitle: "Umrah, Ziarah, Pelancongan & Kapal Persiaran",
    siteDescription:
      "Agensi pelancongan berlesen MOTAC di Shah Alam yang menawarkan pakej Umrah & Ziarah, pelancongan luar dan dalam negara, serta kapal persiaran.",
    packagesTitle: "Pakej pelancongan",
    packagesDescription: "Lihat pakej Umrah & Ziarah, luar negara, dalam negara dan kapal persiaran daripada Moghul Travel & Tours.",
    packageNotFound: "Pakej tidak dijumpai",
    galleryTitle: "Galeri",
    galleryDescription: "Gambar daripada perjalanan bersama Moghul Travel & Tours — Umrah & Ziarah, pelancongan, kapal persiaran dan banyak lagi.",
    testimonialsTitle: "Ulasan pelanggan",
    testimonialsDescription: "Apa kata jemaah dan pelancong Umrah, Ziarah serta pelancongan kami tentang Moghul Travel & Tours.",
    aboutTitle: "Tentang kami",
    contactTitle: "Hubungi kami",
    contactDescription: "Telefon, WhatsApp, e-mel atau kunjungi pejabat Moghul Travel & Tours di Shah Alam, Selangor.",
    inquireTitle: "Hantar pertanyaan",
    inquireDescription: "Tanya Moghul Travel & Tours tentang pakej — kami akan menghubungi anda secepat mungkin.",
  },

  layout: {
    skipToContent: "Langkau ke kandungan",
    adminLogin: "Log masuk admin",
    homeLink: "{name} — laman utama",
    announcements: "Pengumuman",
    whatsappUs: "WhatsApp kami",
  },

  // Pre-filled WhatsApp messages.
  whatsapp: {
    askPackage: "Salam Moghul Travel & Tours, saya ingin bertanya tentang pakej.",
    askUpcoming: "Salam Moghul Travel & Tours, saya ingin tahu tentang pakej akan datang.",
    askPackages: "Salam Moghul Travel & Tours, saya ingin bertanya tentang pakej pelancongan anda.",
    planTrip: "Salam Moghul Travel & Tours, saya ingin merancang percutian.",
    askTrip: "Salam Moghul Travel & Tours, saya ingin bertanya tentang percutian.",
    sentMessage: "Salam Moghul Travel & Tours, saya baru menghantar mesej melalui laman web anda.",
    sentInquiry: "Salam Moghul Travel & Tours, saya baru menghantar pertanyaan melalui laman web anda.",
  },

  footer: {
    office: "Pejabat",
    telFax: "Tel/Faks",
    mobile: "Bimbit",
    officeHours: "Waktu pejabat",
    motac: "No. Lesen MOTAC {value}",
    companyReg: "No. Pendaftaran Syarikat {value}",
    matta: "No. Ahli MATTA {value}",
    contactLink: "Hubungi & arah ke pejabat →",
    reviewsLink: "Ulasan pelanggan →",
    rights: "Hak cipta terpelihara.",
    credit: "Dibangunkan oleh MNB",
  },

  home: {
    featured: "Pakej pelancongan pilihan",
    all: "Semua",
    viewAll: "Lihat semua pakej",
    noPackages:
      "Pakej akan datang kami sedang dimuktamadkan. Hubungi kami dan kami akan kongsikan tarikh terkini Umrah, Ziarah dan pelancongan.",
    askWhatsApp: "Tanya kami di WhatsApp",
    journeysHeading: "Perjalanan kami & maklum balas pelanggan",
    photosCaption: "Kenangan indah daripada perjalanan pelanggan kami",
    viewGallery: "Lihat galeri penuh",
    reviewHeading: "Kata pelanggan kami",
    stars: "{n} daripada 5 bintang",
    allReviews: "Lihat semua ulasan →",
    aboutHeading: "Tentang {name}",
    readStory: "Baca kisah kami →",
  },

  search: {
    label: "Cari pakej",
    destination: "Destinasi",
    destinationPlaceholder: "Ke mana anda ingin pergi?",
    month: "Bulan",
    anyMonth: "Semua bulan",
    category: "Kategori",
    allCategories: "Semua kategori",
    submit: "Cari",
  },

  categories: {
    UMRAH_ZIARAH: "Umrah & Ziarah",
    OUTBOUND: "Luar Negara",
    INBOUND: "Dalam Negara",
    CRUISE: "Kapal Persiaran",
  },

  categoryPills: {
    label: "Kategori pakej",
    all: "Semua pakej",
  },

  availability: {
    OPEN: "Dibuka untuk tempahan",
    ALMOST_FULL: "Hampir penuh",
    FULL: "Penuh",
    COMING_SOON: "Akan datang",
  },

  departureAvailability: {
    OPEN: "Dibuka",
    ALMOST_FULL: "Hampir penuh",
    FULL: "Penuh",
  },

  duration: {
    days: "{n} hari",
    oneDay: "{n} hari",
    nights: "{n} malam",
    oneNight: "{n} malam",
    day: "Hari {n}",
    dayRange: "Hari {start}–{end}",
  },

  prices: {
    startsFrom: "Bermula dari",
    perPax: "seorang",
    perPerson: "seorang",
    askForPrice: "Hubungi kami untuk harga",
    seeDetails: "Lihat butiran harga",
    heading: "Harga seorang",
    traveller: "Pelancong",
    askUs: "Tanya kami",
    travellers: { ADULT: "Dewasa", CHILD: "Kanak-kanak" },
    rooms: {
      TWIN: { label: "Bilik Twin", hint: "2 orang sebilik", short: "twin" },
      TRIPLE: { label: "Bilik Triple", hint: "3 orang sebilik", short: "triple" },
    },
    roomsOffered: "Bilik {rooms}",
    or: "atau",
  },

  card: {
    highlights: "Tarikan utama",
    viewDetails: "Lihat butiran",
    inquire: "Buat pertanyaan",
  },

  packages: {
    title: "Pakej pelancongan kami",
    categoryTitle: "Pakej {category}",
    subtitle: "Lihat pakej Umrah & Ziarah, luar negara, dalam negara dan kapal persiaran kami.",
    matching: "Menunjukkan pakej untuk {terms}.",
    departingIn: "berlepas pada {month}",
    clearSearch: "Kosongkan carian",
    noneTitle: "Tiada pakej dijumpai",
    noneFiltered:
      "Tiada pakej yang sepadan buat masa ini — cuba kategori lain, atau tanya kami terus. Kami juga boleh mengatur percutian mengikut permintaan.",
    noneYet: "Pakej baharu akan tiba tidak lama lagi. Sementara itu, pasukan kami sedia membantu anda merancang percutian.",
  },

  detail: {
    breadcrumb: "Laluan halaman",
    home: "Utama",
    packages: "Pakej",
    motacPackage: "Pakej berlesen MOTAC",
    departures: "Tarikh berlepas akan datang",
    noDepartures: "Tarikh baharu sedang diatur — tanya kami untuk jadual terkini.",
    inquireNow: "Buat pertanyaan sekarang",
    askNextTrip: "Tanya tentang trip seterusnya",
    orCall: "Atau hubungi {phone}",
    trust: "Berlesen MOTAC ({licence}) — lebih sedekad membawa pelancong Malaysia ke destinasi impian.",
    about: "Tentang pakej ini",
    included: "Termasuk dalam pakej",
    itinerary: "Itinerari",
  },

  about: {
    title: "Tentang kami",
    credentials: "Berlesen & berdaftar",
    motac: "No. Lesen MOTAC {value}",
    companyReg: "No. Pendaftaran Syarikat {value}",
    matta: "No. Ahli MATTA {value}",
    basedIn: "Berpangkalan di Shah Alam, Selangor",
    planHeading: "Rancang perjalanan anda bersama kami",
    planText: "Beritahu kami destinasi pilihan anda dan kami akan bantu anda mencari percutian yang sesuai.",
    browse: "Lihat pakej",
  },

  contact: {
    title: "Hubungi kami",
    subtitle: "Kami sedia membantu anda merancang percutian — hubungi kami melalui telefon, WhatsApp, e-mel atau kunjungi pejabat kami.",
    whatsappText: "Cara paling cepat untuk menghubungi kami. {number}",
    whatsappButton: "Sembang di WhatsApp",
    callHeading: "Telefon kami",
    office: "Pejabat (tel/faks): ",
    mobile: "Bimbit: ",
    email: "E-mel",
    hours: "Waktu pejabat",
    visit: "Kunjungi pejabat kami",
    directions: "Dapatkan arah",
    mapTitle: "Peta lokasi pejabat kami: {address}",
    lookingForTrip: "Mencari pakej percutian?",
    browse: "Lihat pakej kami",
    messageHeading: "Hantar mesej kepada kami",
    messageText: "Kami akan menghubungi anda melalui telefon atau e-mel.",
  },

  inquire: {
    title: "Hantar pertanyaan kepada kami",
    subtitle: "Beritahu kami apa yang anda cari dan pasukan kami akan menghubungi anda secepat mungkin.",
    talkHeading: "Lebih suka bercakap terus?",
    talkText: "Kami sedia menjawab soalan anda melalui telefon atau WhatsApp.",
    whatsapp: "WhatsApp {number}",
    call: "Telefon {number}",
  },

  gallery: {
    title: "Perjalanan kami",
    subtitle: "Detik sebenar daripada percutian pelanggan kami.",
    filterLabel: "Tapis gambar mengikut trip",
    all: "Semua gambar",
    empty: "Gambar daripada perjalanan kami akan dipaparkan di sini tidak lama lagi.",
    browse: "Lihat pakej kami",
  },

  testimonials: {
    title: "Kata pelanggan kami",
    subtitle: "Ulasan daripada keluarga, jemaah dan kumpulan yang pernah melancong bersama kami.",
    empty: "Ulasan daripada pelanggan kami akan dipaparkan di sini tidak lama lagi.",
    browse: "Lihat pakej kami",
    stars: "{n} daripada 5 bintang",
  },

  notFound: {
    title: "Halaman tidak dijumpai",
    text: "Halaman ini tidak wujud atau mungkin telah dipindahkan. Lihat pakej kami, atau hantar mesej kepada kami dan kami akan membantu anda.",
    browse: "Lihat pakej",
  },

  // Strings used by interactive (client) components — the only part of the
  // dictionary sent to the browser.
  client: {
    nav: {
      label: "Menu utama",
      home: "Utama",
      packages: "Pakej",
      gallery: "Galeri",
      about: "Tentang Kami",
      contact: "Hubungi",
    },
    menu: {
      open: "Menu",
      close: "Tutup",
      call: "Telefon kami",
      whatsapp: "WhatsApp",
      adminLogin: "Log masuk admin",
    },
    language: {
      label: "Bahasa / Language",
      ms: "Bahasa Melayu",
      en: "English",
    },
    slideshow: {
      play: "Main",
      pause: "Jeda",
      playLabel: "Mainkan tayangan slaid gambar",
      pauseLabel: "Jeda tayangan slaid gambar",
    },
    lightbox: {
      open: "Buka gambar {n} dalam skrin penuh",
      viewer: "Paparan gambar",
      counter: "{n} daripada {total}",
      close: "Tutup",
      previous: "← Sebelumnya",
      next: "Seterusnya →",
    },
    packageGallery: {
      label: "Gambar {title}",
      slide: "Gambar {n} daripada {total}",
      alt: "{title} — gambar {n} daripada {total}",
      previous: "Gambar sebelumnya",
      next: "Gambar seterusnya",
      show: "Tunjuk gambar {n}",
    },
    inquiry: {
      fullName: "Nama penuh",
      phone: "Nombor telefon",
      email: "Alamat e-mel",
      emailPlaceholder: "nama@gmail.com",
      packageInterest: "Pakej yang anda minati",
      general: "Belum pasti / pertanyaan umum",
      message: "Mesej",
      optional: "(pilihan)",
      messagePlaceholder: "cth. bilangan orang, bulan pilihan, sebarang soalan",
      send: "Hantar pertanyaan",
      sending: "Menghantar…",
      privacy: "Kami hanya akan menggunakan maklumat anda untuk membalas pertanyaan ini.",
      thanks: "Terima kasih, {name}!",
      submitted: "Pertanyaan anda telah dihantar. Kami akan menghubungi anda tidak lama lagi.",
      faster: "Mahu jawapan lebih cepat? WhatsApp kami",
      browseMore: "Lihat pakej lain",
      banners: {
        checkFields: "Sila semak ruangan yang ditandakan.",
        captchaFailed: "Sila lengkapkan semakan “Saya manusia” dan cuba lagi.",
      } satisfies Record<InquiryBannerCode, string>,
      errors: {
        nameRequired: "Sila masukkan nama anda.",
        nameTooLong: "Nama terlalu panjang — maksimum 100 aksara.",
        phoneRequired: "Sila masukkan nombor telefon anda.",
        phoneDigits: "Sila masukkan nombor telefon menggunakan angka sahaja.",
        phoneIncomplete: "Sila masukkan nombor telefon yang lengkap, cth. 012-345 6789.",
        emailInvalid: "Sila masukkan alamat e-mel yang sah, cth. nama@gmail.com.",
        packageRequired: "Sila pilih pakej, atau “Belum pasti”.",
        messageTooLong: "Mesej terlalu panjang — maksimum 2,000 aksara.",
        captcha: "Sila tandakan kotak untuk menunjukkan anda bukan robot.",
        invalid: "Sila semak ruangan ini.",
      } satisfies Record<InquiryErrorCode, string>,
    },
  },
};

export type Dictionary = typeof ms;
export type ClientDictionary = Dictionary["client"];
