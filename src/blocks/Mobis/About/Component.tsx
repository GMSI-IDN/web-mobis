'use client'

import React from 'react'
import { RichText } from '@payloadcms/richtext-lexical/react'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

type Props = {
  title?: string
  description?: SerializedEditorState | string // ✅ nama tetap "description"
  image?: any
}

export const AboutSplit: React.FC<Props> = ({ title, description, image }) => {
  const imageUrl = image?.url

  return (
    <section className="background-light about-section py-5">
      <div className="container py-4">
        <div className="row align-items-center g-3">
          <div className="col-6 ">
            <div className="text-about">
              <h2 className="fw-bold primary-color text-center title-about">{title}</h2>

              {/* ✅ RichText output (bold/italic/underline) */}
              <div className="mb-0 primary-color text-justify">
                {typeof description === 'string' ? (
                  // fallback kalau ada data lama yang masih string
                  <p className="mb-0">{description}</p>
                ) : description ? (
                  <RichText data={description} />
                ) : null}
              </div>
            </div>
          </div>

          <div className="col-6">
            <div className="card border-0 shadow-sm overflow-hidden about-rounded">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={title ?? 'About'}
                  className="w-100"
                  style={{ objectFit: 'cover' }}
                />
              ) : (
                <div className="p-4 text-muted small">No image</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
