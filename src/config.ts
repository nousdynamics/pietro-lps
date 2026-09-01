/** Central config — update checkout URL in one place */
export const checkoutUrl = "https://checkout.placeholder";
export const youtubeId = "vtUKqz4rRMQ";
export const guaranteeEmail = "sixsevenplataformadigital@gmail.com";

/** VSL Parte 10 — Preço (22:00 no roteiro completo de referência) */
export const vslScriptReferenceSeconds = 26 * 60;
export const vslRevealAtSeconds = 22 * 60;

/**
 * Segundos da frase de preço neste corte do vídeo (posição no player, não relógio real).
 * null = estima pela proporção do roteiro ou pelas cues em vslPhraseCues.
 */
export const vslRevealPhraseAtSeconds: number | null = null;

export const vslRevealPhrases = [
  "tudo isso, o caminho completo",
  "caminho completo pra voce se tornar um criador consciente",
] as const;

/**
 * Cues da frase de preço — posição no vídeo (segundos), independente da velocidade de reprodução.
 * Ajuste `start`/`dur` se souber o timestamp exato no YouTube Studio.
 */
export const vslPhraseCues = [
  {
    start: 700,
    dur: 10,
    text: "tudo isso o caminho completo pra voce se tornar um criador consciente",
  },
] as const;

export const vslRevealStorageKey = "cc-lp-revealed";
