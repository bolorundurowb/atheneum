export const convertToHttps = (url: string) => {
  if (url.startsWith('http://')) {
    return url.replace('http://', 'https://');
  } else if (url.startsWith('https://')) {
    return url;
  } else {
    return url;
  }
};
