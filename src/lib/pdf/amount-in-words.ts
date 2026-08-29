const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen",
];
const TENS = [
  "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety",
];

function threeDigits(n: number): string {
  if (n === 0) return "";
  if (n < 20) return ONES[n];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? " " + ONES[n % 10] : "");
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  return ONES[hundreds] + " Hundred" + (rest ? " " + threeDigits(rest) : "");
}

export function amountInWords(amount: number): string {
  if (amount === 0) return "Zero Pesos Only";

  const rounded = Math.round(amount * 100) / 100;
  const pesos = Math.floor(rounded);
  const centavos = Math.round((rounded - pesos) * 100);

  const parts: string[] = [];

  if (pesos >= 1_000_000) {
    parts.push(threeDigits(Math.floor(pesos / 1_000_000)) + " Million");
  }
  if (pesos >= 1_000) {
    parts.push(threeDigits(Math.floor((pesos % 1_000_000) / 1_000)) + " Thousand");
  }
  if (pesos % 1_000 > 0 || pesos === 0) {
    parts.push(threeDigits(pesos % 1_000));
  }

  const pesoWords = parts.filter(Boolean).join(" ");
  const pesoText = pesoWords + (pesos === 1 ? " Peso" : " Pesos");

  if (centavos === 0) return pesoText + " Only";
  return pesoText + ` and ${centavos}/100`;
}
