export const venueAddressMaxLength = 150;

type VenueInput = {
  name?: unknown;
  address?: unknown;
};

export type ParsedVenueInput =
  | {
      data: {
        name: string;
        address: string;
      };
      error: null;
    }
  | {
      data: null;
      error: string;
    };

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function parseVenueInput(body: VenueInput): ParsedVenueInput {
  const name = normalizeText(body.name);
  const address = normalizeText(body.address);

  if (!name || !address) {
    return {
      data: null,
      error: "必須項目を入力してください。"
    };
  }

  if (address.length > venueAddressMaxLength) {
    return {
      data: null,
      error: `住所は${venueAddressMaxLength}文字以内で入力してください。`
    };
  }

  return {
    data: {
      name,
      address
    },
    error: null
  };
}
