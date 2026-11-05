export const ctaPill =
  "cta inline-flex min-h-12 items-center justify-center rounded-pill bg-black px-6 font-medium text-white no-underline";

export const chip =
  "inline-flex rounded-pill border border-line bg-white px-4 py-1 text-base font-medium";

export const navLink =
  "inline-flex min-h-12 items-center text-base font-medium text-black no-underline underline-offset-4 decoration-2 hover:underline aria-[current]:underline";

export const inlineLink = "underline underline-offset-4 hover:decoration-2";

const keywordBase =
  "inline-flex min-h-12 cursor-pointer items-center rounded-pill border border-black bg-black px-5 text-base font-bold text-white";

export const keywordButton = `${keywordBase} active:bg-yellow active:text-black`;

export const teamsButton = [
  keywordBase,
  "w-full justify-center sm:w-auto",
  "aria-disabled:cursor-not-allowed aria-disabled:border-line aria-disabled:bg-paper aria-disabled:text-muted",
  "aria-[disabled=false]:active:bg-yellow aria-[disabled=false]:active:text-black",
].join(" ");
