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
    "/services/upload": {
      post: {
        operationId: "uploadServiceImage",
        summary: "Upload a service listing image",
        tags: ["Services"],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["image"],
                properties: {
                  image: { type: "string", format: "binary" },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Image stored",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["image_url", "filename"],
                  properties: {
                    image_url: { type: "string" },
                    filename: { type: "string" },
                  },
                },
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
        },
      },
    },
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
      post: {
        operationId: "createService",
        summary: "Create a service listing (seller is provider_id)",
        tags: ["Services"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateServiceBody" },
            },
          },
        },
        responses: {
          "201": {
            description: "Service created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Service" },
              },
            },
          },
          "400": {
            description: "Validation error or unknown provider user",
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
            description:
              "Validation error, unknown user/service, or self-purchase (buyer cannot order own listing)",
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
    "/auth/register": {
      post: {
        operationId: "registerUser",
        summary: "Create an account (no JWT until email is confirmed)",
        tags: ["Auth"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterBody" },
            },
          },
        },
        responses: {
          "201": {
            description: "User created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RegisterResponse" },
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
          "409": {
            description: "Email already registered",
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
    "/auth/login": {
      post: {
        operationId: "loginUser",
        summary: "Log in with email and password (returns JWT)",
        tags: ["Auth"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginBody" },
            },
          },
        },
        responses: {
          "200": {
            description: "Authenticated",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthTokenResponse" },
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
          "401": {
            description: "Invalid credentials",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiError" },
              },
            },
          },
          "403": {
            description: "Email not yet confirmed",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiError" },
              },
            },
          },
          "503": {
            description: "JWT_SECRET not configured",
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
    "/auth/me": {
      get: {
        operationId: "getCurrentUser",
        summary: "Current user and owned services (JWT)",
        tags: ["Auth"],
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Profile and services where owner_user_id matches",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MeResponse" },
              },
            },
          },
          "401": {
            description: "Missing or invalid token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiError" },
              },
            },
          },
          "404": {
            description: "User deleted since token was issued",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiError" },
              },
            },
          },
          "403": {
            description: "Email not confirmed for this account",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiError" },
              },
            },
          },
          "503": {
            description: "JWT_SECRET not configured",
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
    "/auth/confirm-email": {
      get: {
        operationId: "confirmEmail",
        summary: "Confirm email address (token from registration email)",
        tags: ["Auth"],
        parameters: [
          {
            name: "token",
            in: "query",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Email confirmed",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ConfirmEmailResponse" },
              },
            },
          },
          "400": {
            description: "Missing or invalid token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiError" },
              },
            },
          },
          "404": {
            description: "User missing after confirm",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiError" },
              },
            },
          },
          "503": {
            description: "JWT_SECRET not configured",
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
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      Service: {
        type: "object",
        required: [
          "id",
          "user_id",
          "provider_id",
          "provider_label",
          "name",
          "description",
          "price_cents",
          "location",
          "rating",
          "created_at",
          "latitude",
          "longitude",
          "avg_rating",
          "review_count",
        ],
        properties: {
          id: { type: "string", format: "uuid" },
          user_id: {
            type: "string",
            format: "uuid",
            description: "User id of the listing creator",
          },
          provider_id: {
            type: "string",
            format: "uuid",
            description: "Alias of user_id (listing owner)",
          },
          provider_label: {
            type: "string",
            description: "Human-readable seller label (name, email, or id)",
          },
          name: { type: "string" },
          description: { type: "string" },
          price_cents: { type: "integer", minimum: 0 },
          location: { type: "string", description: "Human-readable service location" },
          rating: {
            type: ["number", "null"],
            description: "Review average when present, else optional listing rating",
          },
          image_url: { type: "string" },
          created_at: { type: "string", format: "date-time" },
          latitude: { type: "number" },
          longitude: { type: "number" },
          avg_rating: { type: ["number", "null"] },
          review_count: { type: "integer", minimum: 0 },
        },
      },
      CreateServiceBody: {
        type: "object",
        required: [
          "user_id",
          "name",
          "description",
          "location",
          "price_cents",
          "latitude",
          "longitude",
        ],
        properties: {
          user_id: {
            type: "string",
            format: "uuid",
            description: "Creator user id (must exist in users)",
          },
          providerId: {
            type: "string",
            format: "uuid",
            description: "Alias of user_id",
          },
          name: { type: "string" },
          description: { type: "string" },
          location: { type: "string" },
          rating: {
            type: "number",
            minimum: 0,
            maximum: 5,
            description: "Optional listing rating set by the provider",
          },
          image_url: {
            type: "string",
            description:
              "Path from POST /services/upload (/uploads/services/…) or seeded /images/services/…",
          },
          price_cents: { type: "integer", minimum: 0 },
          latitude: { type: "number" },
          longitude: { type: "number" },
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
      RegisterBody: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 8 },
          fullName: { type: "string" },
          full_name: { type: "string" },
        },
      },
      LoginBody: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string" },
        },
      },
      UserPublic: {
        type: "object",
        required: ["id", "email", "full_name", "created_at"],
        properties: {
          id: { type: "string", format: "uuid" },
          email: { type: "string" },
          full_name: { type: ["string", "null"] },
          created_at: { type: "string", format: "date-time" },
        },
      },
      AuthTokenResponse: {
        type: "object",
        required: ["token", "user"],
        properties: {
          token: { type: "string" },
          user: { $ref: "#/components/schemas/UserPublic" },
        },
      },
      RegisterResponse: {
        type: "object",
        required: ["user", "confirmationEmailSent"],
        properties: {
          user: { $ref: "#/components/schemas/UserPublic" },
          confirmationEmailSent: {
            type: "boolean",
            description: "True if SMTP accepted the confirmation email (e.g. MailHog)",
          },
        },
      },
      ConfirmEmailResponse: {
        type: "object",
        required: ["ok", "email", "token", "user"],
        properties: {
          ok: { type: "boolean" },
          email: { type: "string" },
          token: { type: "string" },
          user: { $ref: "#/components/schemas/UserPublic" },
        },
      },
      MeResponse: {
        type: "object",
        required: ["user", "services"],
        properties: {
          user: { $ref: "#/components/schemas/UserPublic" },
          services: {
            type: "array",
            items: { $ref: "#/components/schemas/Service" },
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
