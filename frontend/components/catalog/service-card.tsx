"use client";

import Link from "next/link";
import {
  formatServicePrice,
  formatServiceRating,
  serviceCardImageUrl,
  serviceDisplayLocation,
} from "@/lib/service-display";
import type { ServiceDTO } from "@/lib/types";

export function ServiceCard(props: {
  service: ServiceDTO;
  href: string;
  highlighted?: boolean;
}): JSX.Element {
  const { service, href, highlighted = false } = props;
  const ratingLabel = formatServiceRating(service.rating);

  return (
    <Link
      href={href}
      className={`catalog-service-card no-underline${
        highlighted ? " catalog-service-card--highlighted" : ""
      }`}
      aria-label={`View ${service.name}`}
    >
      <div className="catalog-service-card__media">
        <img
          src={serviceCardImageUrl(service)}
          alt=""
          className="catalog-service-card__image"
          loading="lazy"
          decoding="async"
        />
      </div>
      <div className="catalog-service-card__body">
        <h2 className="catalog-service-card__title">{service.name}</h2>
        <p className="catalog-service-card__meta">{serviceDisplayLocation(service)}</p>
        <p className="catalog-service-card__meta">{formatServicePrice(service.price_cents)}</p>
        <div className="catalog-service-card__footer">
          {ratingLabel ? (
            <span className="catalog-service-card__rating" aria-label={`Rating ${ratingLabel}`}>
              <span className="catalog-service-card__star" aria-hidden>
                ★
              </span>
              {ratingLabel}
            </span>
          ) : (
            <span className="catalog-service-card__rating catalog-service-card__rating--empty">
              No rating yet
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
