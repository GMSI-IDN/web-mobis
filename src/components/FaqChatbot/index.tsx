import type { AdminViewServerProps } from 'payload'
import FaqChatbotClient from './FaqChatbotClient'
import { INITIAL_FAQS } from './mockData'
import type { FaqItem } from './types'
import { fetchAllVectorFaqs } from '@/utilities/chatbotDb'

export default async function FaqChatbotView({
  payload,
  initPageResult,
}: AdminViewServerProps) {
  let faqs: FaqItem[] = []

  // 1. Ambil data langsung dari tabel-tabel vector database chatBotMobisLocal
  try {
    const vectorFaqs = await fetchAllVectorFaqs()
    if (vectorFaqs && vectorFaqs.length > 0) {
      faqs = vectorFaqs
      console.log(`[FaqChatbotView] Berhasil memuat ${faqs.length} data riil dari chatBotMobisLocal!`)
    }
  } catch (err) {
    console.warn('[FaqChatbotView] Kendala membaca chatBotMobisLocal, mencoba fallback Payload CMS:', err)
  }

  // 2. Fallback ke koleksi chatbot-faqs di Payload CMS jika tabel vektor kosong
  if (faqs.length === 0) {
    try {
      const payloadInstance = payload ?? initPageResult?.req?.payload
      const req = initPageResult?.req

      if (payloadInstance) {
        const result = await payloadInstance.find({
          collection: 'chatbot-faqs',
          limit: 100,
          overrideAccess: false,
          req,
        })

        if (result.docs && result.docs.length > 0) {
          faqs = result.docs.map((doc: any) => ({
            id: doc.id,
            uuid: doc.uuid,
            question: doc.question,
            answer: doc.answer,
            environment: doc.environment || 'staging',
            channel: doc.channel || 'dm',
            category: doc.category || 'Umum',
            status: doc.status || 'active',
            order: doc.order,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
          }))
        }
      }
    } catch (err) {
      console.warn('[FaqChatbotView] Fallback collection chatbot-faqs error:', err)
    }
  }

  // 3. Fallback terakhir ke mock data jika database belum terisi
  if (faqs.length === 0) {
    faqs = INITIAL_FAQS
  }

  return <FaqChatbotClient initialFaqs={faqs} />
}
