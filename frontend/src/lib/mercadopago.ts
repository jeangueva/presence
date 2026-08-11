/**
 * Loader for the MercadoPago browser SDK.
 *
 * Loaded on demand rather than from index.html: it is a third-party script that
 * only the checkout screen needs, and pulling it into every page load would
 * slow down the landing page for the 99% of visitors who never reach checkout.
 */

const SDK_URL = "https://sdk.mercadopago.com/js/v2";

declare global {
  interface Window {
    MercadoPago?: new (
      publicKey: string,
      options?: { locale?: string }
    ) => MercadoPagoInstance;
  }
}

export type MercadoPagoInstance = {
  bricks: () => {
    create: (
      brick: "payment",
      containerId: string,
      settings: PaymentBrickSettings
    ) => Promise<BrickController>;
  };
};

export type BrickController = { unmount: () => void };

export type BrickFormData = {
  token?: string;
  payment_method_id?: string;
  issuer_id?: string;
  installments?: number;
  payer?: {
    email?: string;
    identification?: { type?: string; number?: string };
  };
};

export type PaymentBrickSettings = {
  initialization: {
    amount: number;
    payer?: { email?: string };
  };
  customization?: Record<string, unknown>;
  callbacks: {
    onReady?: () => void;
    onSubmit: (arg: {
      selectedPaymentMethod: string;
      formData: BrickFormData;
    }) => Promise<unknown>;
    onError?: (error: unknown) => void;
  };
};

let loading: Promise<void> | null = null;

/** Idempotent: concurrent callers share one <script> and one promise. */
export const loadMercadoPagoSdk = (): Promise<void> => {
  if (window.MercadoPago) return Promise.resolve();
  if (loading) return loading;

  loading = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${SDK_URL}"]`
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("No se pudo cargar el SDK de MercadoPago"))
      );
      return;
    }
    const script = document.createElement("script");
    script.src = SDK_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      // Let a later attempt retry instead of caching the rejection forever.
      loading = null;
      reject(new Error("No se pudo cargar el SDK de MercadoPago"));
    };
    document.head.appendChild(script);
  });

  return loading;
};

/**
 * Resolve a design token into a color the Brick accepts.
 *
 * tokens.css stores colors as space-separated RGB channels ("0 0 0") so
 * Tailwind's `<alpha-value>` syntax works; the Brick wants a real CSS color,
 * so wrap the channels back into rgb().
 */
export const tokenColor = (name: string, fallback: string): string => {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return raw ? `rgb(${raw})` : fallback;
};
