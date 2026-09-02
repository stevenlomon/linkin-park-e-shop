import Link from 'next/link'
import Image from 'next/image'
import { type ProductListItem } from '@/lib/types'

interface ProductCardProps {
  product: ProductListItem;
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <Link href={`/products/${product.id}`} className="group block">

      {/* Ljus platta bakom bilden, precis som i den riktiga butiken: produkterna
          ligger på ljusgrått mot den svarta sidan */}
      <div className="aspect-square overflow-hidden bg-tile">
        {product.image_id ? (
          <Image
            src={`/api/images/${product.image_id}`}
            alt={product.image_alt_text ?? product.name}
            width={500}
            height={500}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="lp-eyebrow text-ink/30">Ingen bild</span>
          </div>
        )}
      </div>

      <div className="mt-4 space-y-1">
        <h2 className="lp-eyebrow leading-relaxed underline-offset-4 group-hover:underline">
          {product.name}
        </h2>
        <p className="text-sm text-muted">
          {Number(product.current_price).toFixed(2).replace('.', ',')} {product.currency_code ?? 'SEK'}
        </p>
      </div>
    </Link>
  )
};
