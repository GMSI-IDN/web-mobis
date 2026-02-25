import { lexicalToHTML } from '@payloadcms/richtext-lexical'

export async function richTextToHTML(richText: any): Promise<string> {
  if (!richText) return ''
  return lexicalToHTML({
    data: richText,
  })
}
