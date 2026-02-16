'use client'

import React from 'react'

type Props = {
  brand?: string
  address?: string
  instagram?: string
  whatsapp?: string
}

export const FooterSimple: React.FC<Props> = ({ brand, address, instagram, whatsapp }) => {
  return (
    <footer className="bg-success text-white">
      <div className="container py-4">
        <div className="fw-bold mb-2">{brand}</div>

        {address ? <div className="small opacity-75 mb-3">{address}</div> : null}

        <div className="d-flex flex-wrap gap-2">
          {instagram ? (
            <span className="badge text-bg-light">
              IG: <span className="text-dark">{instagram}</span>
            </span>
          ) : null}

          {whatsapp ? (
            <span className="badge text-bg-light">
              WA: <span className="text-dark">{whatsapp}</span>
            </span>
          ) : null}
        </div>
      </div>
    </footer>
  )
}
