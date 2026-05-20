"use client";

import Link from "next/link";
import { Button } from "primereact/button";
import { Message } from "primereact/message";
import { useEffect, useState } from "react";
import { ServiceBookingDialog } from "@/components/catalog/service-booking-dialog";
import { readStoredUser } from "@/lib/auth-storage";
import {
  formatServicePrice,
  formatServiceRating,
  serviceCardImageUrl,
  serviceDisplayLocation,
} from "@/lib/service-display";
import { isServiceListedByUser } from "@/lib/service-ownership";
import {
  categoryCatalogPath,
  getCategoryBySlug,
  type ServiceCategoryId,
} from "@/lib/service-categories";
import type { ServiceDTO } from "@/lib/types";

export function CatalogServiceDetailView(props: {
  categoryId: ServiceCategoryId;
  service: ServiceDTO;
}): JSX.Element {
  const category = getCategoryBySlug(props.categoryId);
  const ratingLabel = formatServiceRating(props.service.rating);
  const [viewerUserId, setViewerUserId] = useState<string | null>(null);
  const [bookingOpen, setBookingOpen] = useState(false);

  useEffect(() => {
    const user = readStoredUser();
    setViewerUserId(user?.id ?? null);
  }, []);

  const isOwnListing = isServiceListedByUser(props.service, viewerUserId);

  return (
    <div className="flex-grow-1 surface-ground">
      <div className="grid p-3 sm:p-4 md:p-5">
        <div className="col-12 xl:col-10 xl:col-offset-1">
          <header className="mb-4 md:mb-5">
            <Link
              href={categoryCatalogPath(props.categoryId)}
              className="text-sm text-primary font-medium no-underline mb-2 inline-block"
            >
              ← {category?.label ?? props.categoryId}
            </Link>
            <h1 className="mt-0 mb-2 text-2xl md:text-3xl font-semibold text-color">
              {props.service.name}
            </h1>
          </header>

          <article className="catalog-service-detail">
            <div className="catalog-service-detail__media">
              <img
                src={serviceCardImageUrl(props.service)}
                alt=""
                className="catalog-service-detail__image"
              />
            </div>
            <div className="catalog-service-detail__content">
              <p className="catalog-service-detail__meta">
                {serviceDisplayLocation(props.service)}
              </p>
              <p className="catalog-service-detail__price">
                {formatServicePrice(props.service.price_cents)}
              </p>
              {ratingLabel ? (
                <p className="catalog-service-detail__rating">
                  <span className="catalog-service-card__star" aria-hidden>
                    ★
                  </span>
                  {ratingLabel}
                  {props.service.review_count > 0
                    ? ` · ${props.service.review_count} review${
                        props.service.review_count === 1 ? "" : "s"
                      }`
                    : ""}
                </p>
              ) : null}
              <p className="catalog-service-detail__description">
                {props.service.description}
              </p>
              {isOwnListing ? (
                <Message
                  severity="info"
                  text="This is your listing. You cannot place an order on your own service."
                  className="w-full border-round-lg catalog-service-detail__own-listing"
                />
              ) : (
                <>
                  <Button
                    label="Book this service"
                    className="catalog-service-detail__cta"
                    onClick={() => setBookingOpen(true)}
                  />
                  <ServiceBookingDialog
                    visible={bookingOpen}
                    onHide={() => setBookingOpen(false)}
                    service={props.service}
                    categoryId={props.categoryId}
                  />
                </>
              )}
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}
