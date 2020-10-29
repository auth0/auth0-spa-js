export const isIE11 = () => /Trident.*rv:11\.0/.test(navigator.userAgent);

export const isSafari10 = () =>
  /AppleWebKit.*Version\/10/.test(navigator.userAgent);

export const isSafari11 = () =>
  /AppleWebKit.*Version\/11/.test(navigator.userAgent);

export const isSafari12_0 = () =>
  /AppleWebKit.*Version\/12\.0/.test(navigator.userAgent);
