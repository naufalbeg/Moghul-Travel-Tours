import { SITE, OTHER_PACKAGES_URL } from "@/lib/site";
import { lines, type SiteContent } from "@/lib/site-content";

// The privacy notice and the terms of use, in Malay and in English.
//
// Malaysia's Personal Data Protection Act 2010 expects a written notice in
// both languages, so each page shows both, whatever language the visitor
// chose. Everything here describes what the website actually does (which
// forms exist, what they store, which services run the site). It promises
// nothing about payment, cancellation or refunds: that wording is the
// owner's. DRAFTED BY CLAUDE (2026-11-12) — the owner should read and
// confirm both pages before they go live.

export type LegalSection = { heading: string; paragraphs?: string[]; items?: string[] };
export type LegalDocument = { lang: "ms" | "en"; title: string; updated: string; sections: LegalSection[] };

/** Date the wording was last changed. */
const UPDATED = { ms: "Dikemas kini pada 12 November 2026", en: "Last updated 12 November 2026" };

function facts(content: SiteContent) {
  return {
    company: `${SITE.legalName} (${content.company_reg})`,
    address: lines(content.address).join(", "),
    email: content.email,
    phone: content.phone,
    whatsapp: content.whatsapp,
    licence: content.motac_license,
  };
}

export function privacyNotice(content: SiteContent): LegalDocument[] {
  const f = facts(content);
  return [
    {
      lang: "ms",
      title: "Notis privasi",
      updated: UPDATED.ms,
      sections: [
        {
          heading: "Siapa kami",
          paragraphs: [
            `Laman web ini dikendalikan oleh ${f.company}, agensi pelancongan berlesen MOTAC (${f.licence}) di ${f.address}. Notis ini menerangkan maklumat peribadi yang dikumpul melalui laman web ini dan cara ia digunakan.`,
          ],
        },
        {
          heading: "Maklumat yang kami kumpul",
          items: [
            "Borang pertanyaan: nama, nombor telefon, alamat e-mel, pakej yang anda minati dan mesej anda.",
            "Borang tempahan: maklumat yang sama, serta tarikh berlepas pilihan anda, bilangan peserta bagi setiap jenis harga dan nota anda.",
            "Semakan “Saya manusia” (hCaptcha) pada borang memproses maklumat teknikal tentang peranti dan pelayar anda untuk membezakan manusia daripada robot.",
            "Apabila anda menghubungi kami melalui WhatsApp, telefon atau e-mel: maklumat yang anda berikan dalam perbualan itu.",
          ],
          paragraphs: [
            "Laman web ini tidak meminta butiran pembayaran, dan borang tempahan hanya meminta bilangan kanak-kanak dan bayi, bukan nama atau butiran mereka.",
          ],
        },
        {
          heading: "Mengapa kami mengumpulnya",
          paragraphs: [
            "Kami menggunakan maklumat ini untuk membalas pertanyaan anda, menguruskan permohonan tempahan anda dan menghubungi anda mengenainya.",
            "Memberi maklumat ini adalah sukarela, tetapi tanpa nama dan cara untuk menghubungi anda, kami tidak dapat membalas pertanyaan atau menguruskan tempahan anda.",
            "Laman web ini tidak menghantar surat berita atau e-mel pemasaran.",
          ],
        },
        {
          heading: "Siapa yang menerima maklumat anda",
          paragraphs: [
            "Maklumat anda dilihat oleh staf Moghul Travel & Tours yang menguruskan pertanyaan dan tempahan. Ia juga diproses oleh pembekal perkhidmatan yang menjalankan laman web ini:",
          ],
          items: [
            "Vercel: pengehosan laman web.",
            "Supabase: pangkalan data dan storan gambar.",
            "Resend: penghantaran e-mel pemberitahuan kepada staf kami apabila borang dihantar.",
            "hCaptcha: semakan anti-robot pada borang.",
            "Google Maps: peta di halaman Hubungi.",
          ],
        },
        {
          heading: "Di mana maklumat disimpan",
          paragraphs: [
            "Sebahagian pembekal ini menyimpan atau memproses data di luar Malaysia, termasuk di Singapura dan Amerika Syarikat.",
          ],
        },
        {
          heading: "Kuki",
          paragraphs: ["Laman web ini hanya menggunakan kuki yang diperlukan untuk berfungsi:"],
          items: [
            "“lang”: mengingati pilihan bahasa anda (BM atau EN).",
            "Kuki hCaptcha pada halaman yang mempunyai borang.",
            "Kuki sesi untuk staf yang log masuk ke portal admin.",
          ],
        },
        {
          heading: "Berapa lama kami menyimpannya",
          paragraphs: [
            "Pertanyaan dan permohonan tempahan disimpan dalam sistem kami sehingga staf kami memadamkannya. Anda boleh meminta kami memadamkannya pada bila-bila masa.",
          ],
        },
        {
          heading: "Hak anda",
          paragraphs: [
            `Anda boleh meminta salinan maklumat anda, meminta ia dibetulkan atau dipadamkan, atau menarik balik persetujuan anda. Hubungi kami melalui e-mel ${f.email}, WhatsApp ${f.whatsapp} atau telefon ${f.phone}, atau datang ke pejabat kami di ${f.address}.`,
          ],
        },
      ],
    },
    {
      lang: "en",
      title: "Privacy notice",
      updated: UPDATED.en,
      sections: [
        {
          heading: "Who we are",
          paragraphs: [
            `This website is run by ${f.company}, a MOTAC-licensed travel agency (${f.licence}) at ${f.address}. This notice explains what personal information is collected through this website and how it is used.`,
          ],
        },
        {
          heading: "What we collect",
          items: [
            "Inquiry form: your name, phone number, email address, the package you are interested in and your message.",
            "Booking form: the same details, plus your chosen departure date, the number of travellers for each price type and your notes.",
            "The “I am human” check (hCaptcha) on the forms processes technical information about your device and browser to tell people from robots.",
            "When you contact us by WhatsApp, phone or email: whatever you tell us in that conversation.",
          ],
          paragraphs: [
            "This website does not ask for payment details, and the booking form asks only for the number of children and infants, not their names or details.",
          ],
        },
        {
          heading: "Why we collect it",
          paragraphs: [
            "We use this information to reply to your inquiry, handle your booking request and contact you about it.",
            "Giving it is voluntary, but without a name and a way to reach you we cannot reply to an inquiry or handle a booking.",
            "This website does not send newsletters or marketing emails.",
          ],
        },
        {
          heading: "Who receives your information",
          paragraphs: [
            "Your information is seen by the Moghul Travel & Tours staff who handle inquiries and bookings. It is also processed by the service providers that run this website:",
          ],
          items: [
            "Vercel: website hosting.",
            "Supabase: database and photo storage.",
            "Resend: sends our staff an email alert when a form is submitted.",
            "hCaptcha: the anti-robot check on the forms.",
            "Google Maps: the map on the Contact page.",
          ],
        },
        {
          heading: "Where it is stored",
          paragraphs: [
            "Some of these providers store or process data outside Malaysia, including in Singapore and the United States.",
          ],
        },
        {
          heading: "Cookies",
          paragraphs: ["This website uses only the cookies it needs to work:"],
          items: [
            "“lang”: remembers your language choice (BM or EN).",
            "hCaptcha's cookies on pages that have a form.",
            "A session cookie for staff signed in to the admin portal.",
          ],
        },
        {
          heading: "How long we keep it",
          paragraphs: [
            "Inquiries and booking requests stay in our system until our staff delete them. You can ask us to delete yours at any time.",
          ],
        },
        {
          heading: "Your rights",
          paragraphs: [
            `You can ask for a copy of your information, ask for it to be corrected or deleted, or withdraw your consent. Contact us by email at ${f.email}, on WhatsApp at ${f.whatsapp} or by phone at ${f.phone}, or visit our office at ${f.address}.`,
          ],
        },
      ],
    },
  ];
}

export function termsOfUse(content: SiteContent): LegalDocument[] {
  const f = facts(content);
  const portal = new URL(OTHER_PACKAGES_URL).hostname;
  return [
    {
      lang: "ms",
      title: "Terma penggunaan",
      updated: UPDATED.ms,
      sections: [
        {
          heading: "Tentang laman web ini",
          paragraphs: [
            `Laman web ini dikendalikan oleh ${f.company}, agensi pelancongan berlesen MOTAC (${f.licence}) di ${f.address}.`,
          ],
        },
        {
          heading: "Harga",
          paragraphs: [
            "Semua harga di laman web ini ialah harga bermula bagi seorang (“Bermula dari”). Tambang penerbangan sentiasa berubah, jadi harga akhir disahkan oleh pasukan kami apabila anda menghubungi kami.",
          ],
        },
        {
          heading: "Permohonan tempahan",
          paragraphs: [
            "Menghantar borang tempahan ialah satu permohonan, bukan pengesahan. Tiada bayaran diambil melalui laman web ini. Tempahan anda hanya disahkan apabila pasukan kami menghubungi anda dan mengesahkannya.",
            "Sila tanya pasukan kami tentang syarat pembayaran, pembatalan dan bayaran balik sebelum mengesahkan tempahan anda.",
          ],
        },
        {
          heading: "Maklumat pakej",
          paragraphs: [
            "Butiran pakej, tarikh berlepas dan ketersediaan di laman web ini dikemas kini oleh staf kami dan boleh berubah. Sahkan butiran terkini dengan pasukan kami sebelum membuat rancangan.",
          ],
        },
        {
          heading: "Pautan luar",
          paragraphs: [
            `“Pakej Lain” membuka portal tempahan Muslim Travel Bug (${portal}), yang dikendalikan oleh pihak lain dengan terma dan notis privasi mereka sendiri.`,
          ],
        },
        {
          heading: "Hubungi kami",
          paragraphs: [`E-mel ${f.email}, WhatsApp ${f.whatsapp} atau telefon ${f.phone}.`],
        },
      ],
    },
    {
      lang: "en",
      title: "Terms of use",
      updated: UPDATED.en,
      sections: [
        {
          heading: "About this website",
          paragraphs: [
            `This website is run by ${f.company}, a MOTAC-licensed travel agency (${f.licence}) at ${f.address}.`,
          ],
        },
        {
          heading: "Prices",
          paragraphs: [
            "Every price on this website is a starting price per person (“Starts from”). Airfares change, so our team confirms your final price when you contact us.",
          ],
        },
        {
          heading: "Booking requests",
          paragraphs: [
            "Sending the booking form is a request, not a confirmation. No payment is taken through this website. Your booking is confirmed only when our team contacts you and confirms it.",
            "Please ask our team about the payment, cancellation and refund terms before you confirm your booking.",
          ],
        },
        {
          heading: "Package information",
          paragraphs: [
            "Package details, departure dates and availability on this website are kept up to date by our staff and can change. Check the latest details with our team before making plans.",
          ],
        },
        {
          heading: "Outside links",
          paragraphs: [
            `“Other Packages” opens Muslim Travel Bug's booking portal (${portal}), which is run by another party under its own terms and privacy notice.`,
          ],
        },
        {
          heading: "Contact us",
          paragraphs: [`Email ${f.email}, WhatsApp ${f.whatsapp} or phone ${f.phone}.`],
        },
      ],
    },
  ];
}
