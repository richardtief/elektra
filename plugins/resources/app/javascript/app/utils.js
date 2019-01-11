import { STRINGS } from './constants';

const perFlavorRx = /^instances_(.+)$/;

// Translates API-level strings into user-readable UI strings,
// e.g. "volumev2" -> "Block Storage".
export const t = (str) => {
  //for baremetal flavor resources like "instances_zh2vic1.medium",
  //return the flavor name, e.g. "zh2vic1.medium"
  const match = perFlavorRx.exec(str);
  if (match) {
    return match[1];
  }

  return STRINGS[str] || str;
}

// This can be used as a sorting predicate:
//     sorted_things = things.sort(byUIString)
export const byUIString = (a, b) => {
  const aa = t(a);
  const bb = t(b);
  return (aa < bb) ? -1 : (aa > bb) ? 1 : 0;
};

//Formats large integer numbers for display by adding digit group separators.
export const formatLargeInteger = (value) => {
  //The SI/ISO 31-0 standard recommends to separate each block of three
  //digits by a thin space; Unicode offers the narrow no-break space U+202F
  //for this purpose.
  return Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, "\u202F");
  //^ This beautiful regex courtesy of <https://stackoverflow.com/a/2901298/334761>.
};
