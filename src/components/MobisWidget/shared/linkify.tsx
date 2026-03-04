'use client'
import React from 'react'

const urlRegex = /(https?:\/\/[^\s]+)/g

export function linkifyText(text: string) {
  const parts = text.split(urlRegex)
  return parts.map((part, i) => {
    if (urlRegex.test(part)) {
      return (
        <a key={i} href={part} target="_blank" rel="noreferrer noopener">
          {part}
        </a>
      )
    }
    return <React.Fragment key={i}>{part}</React.Fragment>
  })
}
