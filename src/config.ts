/** Central config — update checkout URL in one place */
export const checkoutUrl = "https://checkout.placeholder";
export const youtubeId = "vtUKqz4rRMQ";
export const guaranteeEmail = "sixsevenplataformadigital@gmail.com";

/** Momento exato no vídeo (posição no player) para revelar conteúdo — 13:20 */
export const vslRevealAtSeconds = 13 * 60 + 20;

export const vslRevealPhrases = [
  "tudo isso, o caminho completo",
  "caminho completo pra voce se tornar um criador consciente",
] as const;

/** Frase de preço neste corte — alinhada ao mesmo ponto do vídeo (13:20) */
export const vslPhraseCues = [
  {
    start: vslRevealAtSeconds,
    dur: 15,
    text: "tudo isso o caminho completo pra voce se tornar um criador consciente",
  },
] as const;

export const vslRevealStorageKey = "cc-lp-revealed";
