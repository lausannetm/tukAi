/** OpenAPI 3.1 document exposed at `/openapi.json` and used by Swagger UI. */
export const openApiDocument: Record<string, unknown> = {
  openapi: "3.1.0",
  info: {
    title: "AI Services Platform API",
    version: "0.1.0",
    description:
      "Next.js Route Handlers backed by PostgreSQL. Run with `docker compose up`.",
  },
  servers: [
    { url: "/", description: "Current host" },
  ],
  paths: {
    "/services": {
      get: {
        operationId: "listServices",
        summary: "List all services",
        tags: ["Services"],
        responses: {
          "200": {
            description: "Array of catalog services",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Service" },
                },
              },
            },
          },
          "500": {
            description: "Database or server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiError" },
              },
            },
          },
        },
      },
    },
    "/services/suggest": {
      post: {
        operationId: "suggestService",
        summary: "AI-assisted service match from natural language search",
        tags: ["Services"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SuggestServiceBody" },
            },
          },
        },
        responses: {
          "200": {
            description: "Suggested catalog row (or none) with a short reason",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuggestServiceResponse" },
              },
            },
          },
          "400": {
            description: "Validation error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiError" },
              },
            },
          },
          "502": {
            description: "Upstream AI error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiError" },
              },
            },
          },
          "503": {
            description: "AI is not configured (missing API key)",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiError" },
              },
            },
          },
        },
      },
    },
    "/orders": {
      post: {
        operationId: "createOrder",
        summary: "Create an order",
        tags: ["Orders"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateOrderBody" },
            },
          },
        },
        responses: {
          "201": {
            description: "Order created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Order" },
              },
            },
          },
          "400": {
            description: "Validation error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiError" },
              },
            },
          },
          "500": {
            description: "Database or server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiError" },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      Service: {
        type: "object",
        required: [
          "id",
          "name",
          "price_cents",
          "created_at",
          "latitude",
          "longitude",
          "avg_rating",
          "review_count",
        ],
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          description: { type: ["string", "null"] },
          price_cents: { type: "integer", minimum: 0 },
          created_at: { type: "string", format: "date-time" },
          latitude: { type: "number" },
          longitude: { type: "number" },
          avg_rating: { type: ["number", "null"] },
          review_count: { type: "integer", minimum: 0 },
        },
      },
      SuggestServiceBody: {
        type: "object",
        required: ["query"],
        properties: {
          query: {
            type: "string",
            description: "Customer search text (max 500 characters)",
          },
          latitude: {
            type: "number",
            description: "Browser geolocation latitude in decimal degrees",
          },
          longitude: {
            type: "number",
            description: "Browser geolocation longitude in decimal degrees",
          },
        },
      },
      SuggestServiceResponse: {
        type: "object",
        required: ["service", "reason"],
        properties: {
          service: {
            anyOf: [{ $ref: "#/components/schemas/Service" }, { type: "null" }],
          },
          reason: { type: "string" },
        },
      },
      Order: {
        type: "object",
        required: [
          "id",
          "user_id",
          "service_id",
          "status",
          "quantity",
          "created_at",
        ],
        properties: {
          id: { type: "string", format: "uuid" },
          user_id: { type: "string", format: "uuid" },
          service_id: { type: "string", format: "uuid" },
          status: { type: "string" },
          quantity: { type: "integer", minimum: 1 },
          created_at: { type: "string", format: "date-time" },
        },
      },
      CreateOrderBody: {
        type: "object",
        required: ["userId", "serviceId"],
        properties: {
          userId: { type: "string", format: "uuid" },
          serviceId: { type: "string", format: "uuid" },
          quantity: {
            type: "integer",
            minimum: 1,
            default: 1,
            description: "Number of units to order",
          },
        },
      },
      ApiError: {
        type: "object",
        required: ["error"],
        properties: {
          error: { type: "string" },
        },
      },
    },
  },
};
