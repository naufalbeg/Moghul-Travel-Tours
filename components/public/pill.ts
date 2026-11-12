/** Filter pills (package categories, gallery labels): the chosen one is filled navy. */
export const pillClass = (active: boolean) =>
  `flex min-h-12 items-center rounded-full border-[1.5px] px-5 text-meta font-bold transition-colors duration-150 ease-smooth ${
    active ? "border-primary-dark bg-primary-dark text-white" : "border-field bg-white text-ink hover:bg-canvas"
  }`;
