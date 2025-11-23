export const PERSONA_REPLY_JSON_SCHEMA = {
  name: "persona_reply",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
          properties: {
            reply: { type: "string" },
            actions: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
            type: {
              type: "string",
              enum: ["update_shipping_address", "cancel_order", "add_tag"],
            },
                  orderId: { type: "number" },
                  payload: {
                    type: "object",
              additionalProperties: false,
              properties: {
                shipping_address: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    name: { type: "string" },
                    address1: { type: "string" },
                    address2: { type: "string" },
                    zip: { type: "string" },
                    city: { type: "string" },
                    country: { type: "string" },
                    phone: { type: "string" },
                  },
                  required: [
                    "name",
                    "address1",
                    "address2",
                    "zip",
                    "city",
                    "country",
                    "phone",
                  ],
                },
                note: { type: "string" },
                tag: { type: "string" },
              },
              required: ["shipping_address", "note", "tag"],
            },
                },
                required: ["type", "orderId", "payload"],
              },
            },
          },
    required: ["reply", "actions"],
  },
};
